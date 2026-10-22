/**
 * components.js
 * KPI 카드, 필터 칩, 신규사업 쇼케이스, 인터랙티브 테이블 및 모달 렌더링 모듈
 */

(function (window) {
  'use strict';

  const Components = {
    /**
     * 숫자 쉼표 포맷
     */
    formatNumber(num) {
      if (num === null || num === undefined) return '0';
      return Number(num).toLocaleString('ko-KR');
    },

    /**
     * 상단 5대 KPI 카드 렌더링
     */
    renderKPICards(metrics) {
      const container = document.getElementById('kpiCardsContainer');
      if (!container) return;

      const {
        totalCount,
        totalPrev,
        totalCurr,
        totalDiff,
        totalGrowthRate,
        newCount,
        newBudgetSum,
        primaryUnit,
        topGrowthItem,
        topBudgetItem
      } = metrics;

      const diffSign = totalDiff > 0 ? '+' : '';
      const diffClass = totalDiff > 0 ? 'text-teal' : (totalDiff < 0 ? 'text-rose' : 'text-slate');

      let rateText = '';
      if (typeof totalGrowthRate === 'number') {
        rateText = (totalGrowthRate > 0 ? '+' : '') + totalGrowthRate + '%';
      } else {
        rateText = totalGrowthRate;
      }

      container.innerHTML = `
        <!-- 카드 1: 총 예산 규모 -->
        <div class="kpi-card card-glow-blue">
          <div class="kpi-header">
            <span class="kpi-title">2027년 예산 총 규모</span>
            <div class="kpi-icon-box bg-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div class="kpi-value-wrap">
            <span class="kpi-main-val">${this.formatNumber(totalCurr)}</span>
            <span class="kpi-unit">${primaryUnit}</span>
          </div>
          <div class="kpi-sub-text">
            <span>2026년 기준: ${this.formatNumber(totalPrev)} ${primaryUnit}</span>
          </div>
        </div>

        <!-- 카드 2: 순 증감 및 증가율 -->
        <div class="kpi-card card-glow-teal">
          <div class="kpi-header">
            <span class="kpi-title">순 증감액 및 증가율</span>
            <div class="kpi-icon-box bg-teal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
            </div>
          </div>
          <div class="kpi-value-wrap">
            <span class="kpi-main-val ${diffClass}">${diffSign}${this.formatNumber(totalDiff)}</span>
            <span class="kpi-unit">${primaryUnit}</span>
          </div>
          <div class="kpi-sub-text">
            <span class="kpi-badge ${diffClass} font-bold">${rateText}</span>
            <span>전년 대비 변동</span>
          </div>
        </div>

        <!-- 카드 3: 신규 및 순증 사업 -->
        <div class="kpi-card card-glow-purple">
          <div class="kpi-header">
            <span class="kpi-title">신규·순증 사업</span>
            <div class="kpi-icon-box bg-purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </div>
          </div>
          <div class="kpi-value-wrap">
            <span class="kpi-main-val text-purple">${newCount}</span>
            <span class="kpi-unit">개 사업</span>
          </div>
          <div class="kpi-sub-text">
            <span>신규 투입 예산: <strong>${this.formatNumber(newBudgetSum)} ${primaryUnit}</strong></span>
          </div>
        </div>

        <!-- 카드 4: 최고 증가율 사업 -->
        <div class="kpi-card card-glow-amber">
          <div class="kpi-header">
            <span class="kpi-title">최고 증가율 사업</span>
            <div class="kpi-icon-box bg-amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
            </div>
          </div>
          <div class="kpi-value-wrap">
            <span class="kpi-main-val text-amber">
              ${topGrowthItem ? (typeof topGrowthItem.growthRate === 'number' ? '+' + topGrowthItem.growthRate + '%' : topGrowthItem.growthRate) : '-'}
            </span>
          </div>
          <div class="kpi-sub-text text-truncate" title="${topGrowthItem ? topGrowthItem.projectName : ''}">
            <span>${topGrowthItem ? topGrowthItem.projectName : '해당 없음'}</span>
          </div>
        </div>

        <!-- 카드 5: 분석 대상 총람 -->
        <div class="kpi-card card-glow-slate">
          <div class="kpi-header">
            <span class="kpi-title">총 분석 항목 수</span>
            <div class="kpi-icon-box bg-slate">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </div>
          </div>
          <div class="kpi-value-wrap">
            <span class="kpi-main-val">${totalCount}</span>
            <span class="kpi-unit">개 항목</span>
          </div>
          <div class="kpi-sub-text">
            <span>최대 예산: ${topBudgetItem ? topBudgetItem.projectName.substring(0, 10) + '…' : '-'}</span>
          </div>
        </div>
      `;
    },

    /**
     * 카테고리 퀵 필터 칩 렌더링
     */
    renderCategoryChips(categories, selectedCategory) {
      const container = document.getElementById('categoryChipsContainer');
      if (!container) return;

      const totalItemsCount = categories.reduce((acc, cur) => acc + cur.count, 0);

      let html = `
        <button class="chip-btn ${selectedCategory === 'all' ? 'active' : ''}" data-category="all">
          전체 분야 <span class="chip-count">${totalItemsCount}</span>
        </button>
      `;

      categories.forEach(cat => {
        const isSelected = selectedCategory === cat.name;
        // 번호 기호나 너무 긴 문자열 정리
        const displayName = cat.name.replace(/^[①-⑳\d.\s]+/, '');
        html += `
          <button class="chip-btn ${isSelected ? 'active' : ''}" data-category="${cat.name}" title="${cat.name}">
            ${displayName} <span class="chip-count">${cat.count}</span>
          </button>
        `;
      });

      container.innerHTML = html;

      // 클릭 이벤트 바인딩
      container.querySelectorAll('.chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const cat = btn.getAttribute('data-category');
          window.AppStore.setSelectedCategory(cat);
        });
      });
    },

    /**
     * 신규 사업 카드 쇼케이스 렌더링
     */
    renderNewProjectsShowcase(newProjects, unit) {
      const container = document.getElementById('newProjectsContainer');
      const countBadge = document.getElementById('newProjectsCountBadge');
      if (!container) return;

      if (countBadge) {
        countBadge.textContent = `${newProjects.length}개 사업`;
      }

      if (newProjects.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <p>현재 조건에 해당하는 신규 착수 사업이 없습니다.</p>
          </div>
        `;
        return;
      }

      let html = '';
      newProjects.forEach(item => {
        html += `
          <div class="spotlight-card" data-item-id="${item.id}">
            <div class="spotlight-card-top">
              <span class="badge-new">NEW 신규사업</span>
              <span class="spotlight-budget">${this.formatNumber(item.currVal)} ${item.unit || unit}</span>
            </div>
            <h4 class="spotlight-title">${item.projectName}</h4>
            <div class="spotlight-category">${item.category}</div>
            <p class="spotlight-desc">${item.description || '핵심 내용 및 보도자료 근거 내용이 등록되어 있습니다.'}</p>
            <button class="spotlight-detail-btn" data-item-id="${item.id}">상세 원문 보기 →</button>
          </div>
        `;
      });

      container.innerHTML = html;

      // 클릭 시 모달 열기
      container.querySelectorAll('[data-item-id]').forEach(el => {
        el.addEventListener('click', (e) => {
          const id = el.getAttribute('data-item-id');
          Components.openDetailModal(id);
        });
      });
    },

    /**
     * 증가율 TOP 5 랭킹 프로그레스 바 렌더링
     */
    renderTopGrowthRanking(topList, unit) {
      const container = document.getElementById('topGrowthContainer');
      if (!container) return;

      if (topList.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <p>증가율 비교 데이터가 없습니다.</p>
          </div>
        `;
        return;
      }

      const maxRate = Math.max(...topList.map(t => typeof t.growthRate === 'number' ? t.growthRate : 100));

      let html = '';
      topList.forEach((item, index) => {
        const rateNum = typeof item.growthRate === 'number' ? item.growthRate : 0;
        const pctWidth = Math.min(100, Math.max(10, (rateNum / maxRate) * 100));

        html += `
          <div class="ranking-item" data-item-id="${item.id}">
            <div class="ranking-header">
              <span class="ranking-badge rank-${index + 1}">0${index + 1}</span>
              <span class="ranking-name" title="${item.projectName}">${item.projectName}</span>
              <span class="ranking-rate">+${rateNum}%</span>
            </div>
            <div class="ranking-bar-track">
              <div class="ranking-bar-fill" style="width: ${pctWidth}%;"></div>
            </div>
            <div class="ranking-meta">
              <span>${item.category}</span>
              <span>증감: +${this.formatNumber(item.diffVal)} ${item.unit || unit}</span>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;

      container.querySelectorAll('.ranking-item').forEach(el => {
        el.addEventListener('click', () => {
          const id = el.getAttribute('data-item-id');
          Components.openDetailModal(id);
        });
      });
    },

    /**
     * 인터랙티브 데이터 테이블 렌더링
     */
    renderTable(items, sortField, sortOrder, unit) {
      const tbody = document.getElementById('dataTableBody');
      const rowCountEl = document.getElementById('tableRowCount');
      if (!tbody) return;

      if (rowCountEl) {
        rowCountEl.textContent = `총 ${items.length}개 항목`;
      }

      // 테이블 헤더 정렬 인디케이터 업데이트
      document.querySelectorAll('th[data-sort]').forEach(th => {
        const field = th.getAttribute('data-sort');
        th.classList.remove('sort-asc', 'sort-desc');
        if (field === sortField) {
          th.classList.add(sortOrder === 'asc' ? 'sort-asc' : 'sort-desc');
        }
      });

      if (items.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" class="table-empty">
              <div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <p>일치하는 데이터 항목이 없습니다. 검색어나 필터를 변경해보세요.</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      let html = '';
      items.forEach(item => {
        const diffSign = item.diffVal > 0 ? '+' : '';
        const diffClass = item.diffVal > 0 ? 'cell-diff-up' : (item.diffVal < 0 ? 'cell-diff-down' : '');
        
        let rateDisplay = '';
        if (item.growthRate === '신규' || item.isNew) {
          rateDisplay = `<span class="badge-tag badge-tag-new">신규</span>`;
        } else if (typeof item.growthRate === 'number') {
          const sign = item.growthRate > 0 ? '+' : '';
          rateDisplay = `<span class="badge-tag ${item.growthRate >= 0 ? 'badge-tag-up' : 'badge-tag-down'}">${sign}${item.growthRate}%</span>`;
        } else {
          rateDisplay = item.growthRate;
        }

        html += `
          <tr data-item-id="${item.id}" class="clickable-row">
            <td class="text-center font-mono">${item.id}</td>
            <td><span class="category-pill">${item.category}</span></td>
            <td class="font-semibold project-name-cell">
              ${item.projectName}
              ${item.isNew ? '<span class="badge-dot-new" title="신규사업"></span>' : ''}
            </td>
            <td class="text-center text-muted">${item.unit || unit}</td>
            <td class="text-right font-mono">${this.formatNumber(item.prevVal)}</td>
            <td class="text-right font-mono font-bold text-accent">${this.formatNumber(item.currVal)}</td>
            <td class="text-right font-mono ${diffClass}">${diffSign}${this.formatNumber(item.diffVal)}</td>
            <td class="text-center">${rateDisplay}</td>
            <td class="desc-cell" title="${item.description || ''}">
              <span class="desc-text">${item.description || '-'}</span>
              <button class="btn-cell-detail" title="상세보기">🔍</button>
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = html;

      // 행 클릭 이벤트 바인딩
      tbody.querySelectorAll('.clickable-row').forEach(row => {
        row.addEventListener('click', (e) => {
          const id = row.getAttribute('data-item-id');
          Components.openDetailModal(id);
        });
      });
    },

    /**
     * 상세 정보 모달 열기
     */
    openDetailModal(itemId) {
      const modal = document.getElementById('detailModal');
      const modalContent = document.getElementById('detailModalBody');
      if (!modal || !modalContent) return;

      const rawItems = window.AppStore.getCurrentSheetRawItems();
      const item = rawItems.find(i => String(i.id) === String(itemId));

      if (!item) return;

      const diffSign = item.diffVal > 0 ? '+' : '';
      const diffClass = item.diffVal > 0 ? 'text-teal' : (item.diffVal < 0 ? 'text-rose' : 'text-slate');

      modalContent.innerHTML = `
        <div class="modal-item-header">
          <div class="modal-badge-row">
            <span class="modal-cat-badge">${item.category}</span>
            ${item.isNew ? '<span class="badge-new">NEW 신규사업</span>' : ''}
            <span class="modal-id-badge">연번 #${item.id}</span>
          </div>
          <h2 class="modal-title">${item.projectName}</h2>
        </div>

        <div class="modal-grid">
          <div class="modal-stat-box">
            <span class="modal-stat-label">2026년 예산 (A)</span>
            <span class="modal-stat-val">${this.formatNumber(item.prevVal)} <small>${item.unit}</small></span>
          </div>
          <div class="modal-stat-box highlight">
            <span class="modal-stat-label">2027년 정부안 (B)</span>
            <span class="modal-stat-val text-accent">${this.formatNumber(item.currVal)} <small>${item.unit}</small></span>
          </div>
          <div class="modal-stat-box">
            <span class="modal-stat-label">증감 (B - A)</span>
            <span class="modal-stat-val ${diffClass}">${diffSign}${this.formatNumber(item.diffVal)} <small>${item.unit}</small></span>
          </div>
          <div class="modal-stat-box">
            <span class="modal-stat-label">증감률 (%)</span>
            <span class="modal-stat-val ${diffClass}">
              ${typeof item.growthRate === 'number' ? (item.growthRate > 0 ? '+' : '') + item.growthRate + '%' : item.growthRate}
            </span>
          </div>
        </div>

        <div class="modal-section">
          <h4 class="modal-sec-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            핵심 내용 및 보도자료 박스 원문 근거
          </h4>
          <div class="modal-desc-box">
            <p>${item.description || '등록된 상세 원문 내용이 없습니다.'}</p>
          </div>
        </div>
      `;

      modal.classList.add('active');
    },

    /**
     * 상세 정보 모달 닫기
     */
    closeDetailModal() {
      const modal = document.getElementById('detailModal');
      if (modal) {
        modal.classList.remove('active');
      }
    },

    /**
     * 엑셀(.xlsx) 파일 다운로드 실행
     */
    exportCurrentTableToExcel(items, sheetName) {
      if (!items || items.length === 0) {
        alert('저장할 데이터가 없습니다.');
        return;
      }

      if (typeof XLSX === 'undefined') {
        alert('엑셀 라이브러리가 로드되지 않았습니다.');
        return;
      }

      // 1. 헤더 정의 (사용자 제공 서식 기준)
      const headers = [
        '연번',
        '분야 (중점영역)',
        '세부 사업 / 주요 지표',
        '구분/단위',
        '2026년 (A)',
        '2027년 정부안 (B)',
        '증감 (B-A)',
        '증가율 (%)',
        '핵심 내용 및 보도자료 박스 원문 근거'
      ];

      // 2. 데이터 행 구성
      const data = [headers];
      items.forEach(item => {
        let rateStr = '';
        if (typeof item.growthRate === 'number') {
          rateStr = (item.growthRate > 0 ? '+' : '') + item.growthRate + '%';
        } else {
          rateStr = item.growthRate || '';
        }

        data.push([
          item.id,
          item.category || '',
          item.projectName || '',
          item.unit || '',
          item.prevVal,
          item.currVal,
          item.diffVal,
          rateStr,
          item.description || ''
        ]);
      });

      // 3. 워크시트 생성
      const ws = XLSX.utils.aoa_to_sheet(data);

      // 4. 컬럼 너비 지정 (글자 잘림 방지)
      ws['!cols'] = [
        { wch: 8 },  // 연번
        { wch: 30 }, // 분야 (중점영역)
        { wch: 42 }, // 세부 사업 / 주요 지표
        { wch: 10 }, // 구분/단위
        { wch: 16 }, // 2026년 (A)
        { wch: 18 }, // 2027년 정부안 (B)
        { wch: 16 }, // 증감 (B-A)
        { wch: 14 }, // 증가율 (%)
        { wch: 70 }  // 핵심 내용 및 보도자료 박스 원문 근거
      ];

      // 5. 워크북 생성 및 시트 추가
      const wb = XLSX.utils.book_new();
      const safeSheetName = (sheetName || '사업목록').replace(/[\\/?*\[\]]/g, '_').substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

      // 6. 파일 다운로드 실행
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const fileName = `${safeSheetName}_대시보드결과_${dateStr}.xlsx`;
      XLSX.writeFile(wb, fileName);
    },

    /**
     * CSV 다운로드 실행
     */
    exportCurrentTableToCSV(items, sheetName) {
      if (!items || items.length === 0) {
        alert('내보낼 데이터가 없습니다.');
        return;
      }

      const headers = ['연번', '분야', '세부 사업명', '단위', '2026년', '2027년 정부안', '증감', '증가율', '핵심 내용 및 보도자료 근거'];
      const rows = items.map(i => [
        `"${i.id}"`,
        `"${(i.category || '').replace(/"/g, '""')}"`,
        `"${(i.projectName || '').replace(/"/g, '""')}"`,
        `"${(i.unit || '').replace(/"/g, '""')}"`,
        i.prevVal,
        i.currVal,
        i.diffVal,
        `"${i.growthRate}"`,
        `"${(i.description || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${sheetName || '예산_대시보드'}_데이터.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  window.AppComponents = Components;
})(window);
