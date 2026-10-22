/**
 * state.js
 * 대시보드 중앙 상태 관리 및 파생 데이터(지표/통계) 계산 모듈
 */

(function (window) {
  'use strict';

  class Store {
    constructor() {
      this.state = {
        fileName: '',
        sheetNames: [],
        currentSheet: '',
        sheetsData: {}, // { [sheetName]: Array<Item> }
        
        // 필터 상태
        selectedCategory: 'all',
        onlyNew: false,
        searchQuery: '',
        sortField: 'id',
        sortOrder: 'asc'
      };

      this.listeners = [];
    }

    /**
     * 리스너 등록
     */
    subscribe(listener) {
      this.listeners.push(listener);
    }

    /**
     * 상태 변경 알림
     */
    notify() {
      this.listeners.forEach(fn => fn(this.state));
    }

    /**
     * 파싱된 워크북 데이터 설정
     */
    setWorkbookData(parsed) {
      this.state.fileName = parsed.fileName;
      this.state.sheetNames = parsed.sheetNames;
      this.state.sheetsData = parsed.sheets;
      
      // 사용자가 캡처한 이미지의 8대 중점투자사업 시트를 최우선 기본 시트로 선택
      let defaultSheet = parsed.sheetNames[0] || '';
      for (const name of parsed.sheetNames) {
        if (name.includes('8대') || name.includes('중점투자사업') || name.includes('수치비교')) {
          defaultSheet = name;
          break;
        }
      }
      if (!defaultSheet.includes('8대') && !defaultSheet.includes('중점투자')) {
        for (const name of parsed.sheetNames) {
          if (name.includes('세부사업') || name.includes('중점')) {
            defaultSheet = name;
            break;
          }
        }
      }
      this.state.currentSheet = defaultSheet;

      // 필터 초기화
      this.state.selectedCategory = 'all';
      this.state.onlyNew = false;
      this.state.searchQuery = '';
      this.state.sortField = 'id';
      this.state.sortOrder = 'asc';

      this.notify();
    }

    /**
     * 활성 시트 변경
     */
    setCurrentSheet(sheetName) {
      if (this.state.sheetNames.includes(sheetName)) {
        this.state.currentSheet = sheetName;
        this.state.selectedCategory = 'all';
        this.state.onlyNew = false;
        this.state.searchQuery = '';
        this.notify();
      }
    }

    /**
     * 분야 필터 변경
     */
    setSelectedCategory(category) {
      this.state.selectedCategory = category;
      this.notify();
    }

    /**
     * 신규 사업 전용 토글
     */
    setOnlyNew(boolVal) {
      this.state.onlyNew = !!boolVal;
      this.notify();
    }

    /**
     * 검색어 변경
     */
    setSearchQuery(query) {
      this.state.searchQuery = (query || '').trim().toLowerCase();
      this.notify();
    }

    /**
     * 정렬 기준 변경
     */
    setSort(field) {
      if (this.state.sortField === field) {
        this.state.sortOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.state.sortField = field;
        this.state.sortOrder = 'desc'; // 숫자형 지표 우선 정렬 편의
      }
      this.notify();
    }

    /**
     * 현재 활성 시트의 원본 전체 데이터 반환
     */
    getCurrentSheetRawItems() {
      return this.state.sheetsData[this.state.currentSheet] || [];
    }

    /**
     * 사용 가능한 모든 분야(Category) 목록 및 각 분야별 건수 반환
     */
    getCategories() {
      const items = this.getCurrentSheetRawItems();
      const catCount = {};

      items.forEach(item => {
        const cat = item.category || '기타';
        catCount[cat] = (catCount[cat] || 0) + 1;
      });

      return Object.keys(catCount).map(cat => ({
        name: cat,
        count: catCount[cat]
      }));
    }

    /**
     * 필터/검색/정렬이 적용된 아이템 목록 반환
     */
    getFilteredItems() {
      let items = [...this.getCurrentSheetRawItems()];

      // 1. 분야 필터
      if (this.state.selectedCategory !== 'all') {
        items = items.filter(item => item.category === this.state.selectedCategory);
      }

      // 2. 신규 사업 필터
      if (this.state.onlyNew) {
        items = items.filter(item => item.isNew);
      }

      // 3. 검색어 필터
      if (this.state.searchQuery) {
        const q = this.state.searchQuery;
        items = items.filter(item => {
          return (
            (item.projectName && item.projectName.toLowerCase().includes(q)) ||
            (item.category && item.category.toLowerCase().includes(q)) ||
            (item.description && item.description.toLowerCase().includes(q)) ||
            (item.id && String(item.id).toLowerCase().includes(q))
          );
        });
      }

      // 4. 정렬
      const { sortField, sortOrder } = this.state;
      const factor = sortOrder === 'asc' ? 1 : -1;

      items.sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        // rate가 '신규'인 경우 정렬 처리
        if (sortField === 'growthRate') {
          if (valA === '신규') valA = 99999;
          if (valB === '신규') valB = 99999;
        }

        // 숫자 비교
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * factor;
        }

        // 연번(id) 숫자형 비교 시도
        if (sortField === 'id') {
          const numA = parseInt(valA, 10);
          const numB = parseInt(valB, 10);
          if (!isNaN(numA) && !isNaN(numB)) {
            return (numA - numB) * factor;
          }
        }

        // 문자열 비교
        return String(valA || '').localeCompare(String(valB || ''), 'ko') * factor;
      });

      return items;
    }

    /**
     * 최상단 인포그래픽 KPI 지표 계산
     */
    getSummaryMetrics() {
      const items = this.getFilteredItems();
      const totalCount = items.length;

      let totalPrev = 0;
      let totalCurr = 0;
      let newCount = 0;
      let newBudgetSum = 0;
      let increasedCount = 0;
      let decreasedCount = 0;

      let topGrowthItem = null;
      let maxGrowthRate = -Infinity;

      let topBudgetItem = null;
      let maxBudget = -Infinity;

      items.forEach(item => {
        totalPrev += (item.prevVal || 0);
        totalCurr += (item.currVal || 0);

        if (item.isNew) {
          newCount++;
          newBudgetSum += (item.currVal || 0);
        }

        if (item.diffVal > 0) increasedCount++;
        if (item.diffVal < 0) decreasedCount++;

        // 최고 증가율 탐색
        let rateNum = typeof item.growthRate === 'number' ? item.growthRate : 0;
        if (rateNum > maxGrowthRate) {
          maxGrowthRate = rateNum;
          topGrowthItem = item;
        }

        // 최대 예산액 사업 탐색
        if (item.currVal > maxBudget) {
          maxBudget = item.currVal;
          topBudgetItem = item;
        }
      });

      const totalDiff = totalCurr - totalPrev;
      const totalGrowthRate = totalPrev > 0
        ? parseFloat(((totalDiff / totalPrev) * 100).toFixed(1))
        : (totalCurr > 0 ? '순증' : 0);

      // 주요 단위 추출 (억 원, 명 등)
      const primaryUnit = (items[0] && items[0].unit) ? items[0].unit : '억 원';

      return {
        totalCount,
        totalPrev,
        totalCurr,
        totalDiff,
        totalGrowthRate,
        newCount,
        newBudgetSum,
        increasedCount,
        decreasedCount,
        primaryUnit,
        topGrowthItem,
        topBudgetItem
      };
    }

    /**
     * 분야(Category)별 집계 통계 (차트용)
     */
    getCategoryStats() {
      const items = this.getFilteredItems();
      const statsMap = {};

      items.forEach(item => {
        const cat = item.category || '기타';
        if (!statsMap[cat]) {
          statsMap[cat] = {
            category: cat,
            currVal: 0,
            prevVal: 0,
            diffVal: 0,
            count: 0,
            newCount: 0
          };
        }

        statsMap[cat].currVal += (item.currVal || 0);
        statsMap[cat].prevVal += (item.prevVal || 0);
        statsMap[cat].diffVal += (item.diffVal || 0);
        statsMap[cat].count += 1;
        if (item.isNew) statsMap[cat].newCount += 1;
      });

      const categories = Object.values(statsMap);
      // 예산액 내림차순 정렬
      categories.sort((a, b) => b.currVal - a.currVal);
      return categories;
    }

    /**
     * 증가율 TOP 5 사업 추출
     */
    getTopGrowthProjects(limit = 5) {
      const items = this.getFilteredItems();
      // 숫자인 증가율을 가진 사업 중 가장 높은 사업
      const sorted = items
        .filter(i => typeof i.growthRate === 'number' && i.growthRate > 0)
        .sort((a, b) => b.growthRate - a.growthRate);
      return sorted.slice(0, limit);
    }

    /**
     * 신규 착수 사업 리스트
     */
    getNewProjects() {
      const items = this.getFilteredItems();
      return items.filter(i => i.isNew);
    }
  }

  window.AppStore = new Store();
})(window);
