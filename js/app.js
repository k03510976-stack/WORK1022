/**
 * app.js
 * 메인 애플리케이션 진입점 및 이벤트 리스너 통합 바인딩
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initApp();
  });

  function initApp() {
    setupFileUpload();
    setupSheetTabs();
    setupSearchAndFilters();
    setupTableSorting();
    setupModal();
    setupStoreSubscription();

    // 초기 데이터 로드 (기본 내장 2027 국방예산 데이터)
    loadDefaultSampleData();
  }

  /**
   * 파일 업로드 및 드래그 앤 드롭 설정
   */
  function setupFileUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const btnSelectFile = document.getElementById('btnSelectFile');
    const btnLoadSample = document.getElementById('btnLoadSample');

    if (btnSelectFile && fileInput) {
      btnSelectFile.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
      });
    }

    if (dropZone && fileInput) {
      dropZone.addEventListener('click', () => fileInput.click());

      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.remove('dragover');
        });
      });

      dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          handleFile(files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleFile(e.target.files[0]);
        }
      });
    }

    if (btnLoadSample) {
      btnLoadSample.addEventListener('click', () => {
        loadDefaultSampleData();
      });
    }
  }

  /**
   * 파일 파싱 및 스토어 탑재
   */
  async function handleFile(file) {
    const validExts = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const isValid = validExts.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      alert('엑셀 파일(.xlsx, .xls) 또는 CSV 파일만 업로드할 수 있습니다.');
      return;
    }

    showLoading(true);

    try {
      const parsedWorkbook = await window.AppParser.parseFile(file);
      window.AppStore.setWorkbookData(parsedWorkbook);
    } catch (err) {
      console.error('File parse error:', err);
      alert('파일을 파싱하는 도중 오류가 발생했습니다: ' + (err.message || err));
    } finally {
      showLoading(false);
    }
  }

  /**
   * 기본 탑재 샘플 데이터 로드
   */
  function loadDefaultSampleData() {
    if (window.DEFAULT_SAMPLE_DATA) {
      showLoading(true);
      try {
        const parsed = window.AppParser.parseSampleData(window.DEFAULT_SAMPLE_DATA);
        window.AppStore.setWorkbookData(parsed);
      } catch (err) {
        console.error('Failed to load sample data:', err);
      } finally {
        showLoading(false);
      }
    }
  }

  /**
   * 다중 시트 탭 바인딩
   */
  function setupSheetTabs() {
    const tabsContainer = document.getElementById('sheetTabs');
    if (!tabsContainer) return;

    tabsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.sheet-tab-btn');
      if (btn) {
        const sheetName = btn.getAttribute('data-sheet');
        window.AppStore.setCurrentSheet(sheetName);
      }
    });
  }

  /**
   * 검색 및 필터 이벤트 설정
   */
  function setupSearchAndFilters() {
    const searchInput = document.getElementById('searchInput');
    const toggleOnlyNew = document.getElementById('toggleOnlyNew');
    const btnExportExcel = document.getElementById('btnExportExcel');
    const btnExportCSV = document.getElementById('btnExportCSV');
    const btnResetFilter = document.getElementById('btnResetFilter');

    if (searchInput) {
      let debounceTimer = null;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          window.AppStore.setSearchQuery(e.target.value);
        }, 200);
      });
    }

    if (toggleOnlyNew) {
      toggleOnlyNew.addEventListener('change', (e) => {
        window.AppStore.setOnlyNew(e.target.checked);
      });
    }

    if (btnExportExcel) {
      btnExportExcel.addEventListener('click', () => {
        const items = window.AppStore.getFilteredItems();
        const sheetName = window.AppStore.state.currentSheet;
        window.AppComponents.exportCurrentTableToExcel(items, sheetName);
      });
    }

    if (btnExportCSV) {
      btnExportCSV.addEventListener('click', () => {
        const items = window.AppStore.getFilteredItems();
        const sheetName = window.AppStore.state.currentSheet;
        window.AppComponents.exportCurrentTableToCSV(items, sheetName);
      });
    }

    if (btnResetFilter) {
      btnResetFilter.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (toggleOnlyNew) toggleOnlyNew.checked = false;
        window.AppStore.setSelectedCategory('all');
        window.AppStore.setOnlyNew(false);
        window.AppStore.setSearchQuery('');
      });
    }
  }

  /**
   * 테이블 헤더 정렬 바인딩
   */
  function setupTableSorting() {
    document.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const sortField = th.getAttribute('data-sort');
        window.AppStore.setSort(sortField);
      });
    });
  }

  /**
   * 모달 닫기 이벤트 설정
   */
  function setupModal() {
    const modal = document.getElementById('detailModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    const overlay = document.getElementById('modalOverlay');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => window.AppComponents.closeDetailModal());
    }
    if (overlay) {
      overlay.addEventListener('click', () => window.AppComponents.closeDetailModal());
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
        window.AppComponents.closeDetailModal();
      }
    });
  }

  /**
   * 스토어 상태 변경 시 뷰 전체 갱신 구독
   */
  function setupStoreSubscription() {
    window.AppStore.subscribe((state) => {
      renderAllViews(state);
    });
  }

  /**
   * 모든 뷰 컴포넌트 렌더링
   */
  function renderAllViews(state) {
    const { fileName, currentSheet, sheetNames, selectedCategory, onlyNew, sortField, sortOrder } = state;

    // 1. 헤더 파일 및 시트 메타 업데이트
    const fileNameEl = document.getElementById('loadedFileName');
    const currentSheetBadge = document.getElementById('currentSheetBadge');
    if (fileNameEl) fileNameEl.textContent = fileName || '데이터 없음';
    if (currentSheetBadge) currentSheetBadge.textContent = currentSheet || '시트 없음';

    // 2. 시트 탭 목록 렌더링
    renderSheetTabsList(sheetNames, currentSheet);

    // 3. 통계 및 지표 계산
    const metrics = window.AppStore.getSummaryMetrics();
    const categories = window.AppStore.getCategories();
    const categoryStats = window.AppStore.getCategoryStats();
    const topGrowthProjects = window.AppStore.getTopGrowthProjects(5);
    const newProjects = window.AppStore.getNewProjects();
    const filteredItems = window.AppStore.getFilteredItems();

    // 4. 상단 5대 KPI 카드 렌더링
    window.AppComponents.renderKPICards(metrics);

    // 5. 차트 업데이트 (도넛 및 수평 바)
    window.AppCharts.updateAll(categoryStats, metrics.primaryUnit);

    // 6. 카테고리 퀵 필터 칩 렌더링
    window.AppComponents.renderCategoryChips(categories, selectedCategory);

    // 7. 신규 사업 쇼케이스 & TOP 5 랭킹 렌더링
    window.AppComponents.renderNewProjectsShowcase(newProjects, metrics.primaryUnit);
    window.AppComponents.renderTopGrowthRanking(topGrowthProjects, metrics.primaryUnit);

    // 8. 인터랙티브 데이터 테이블 렌더링
    window.AppComponents.renderTable(filteredItems, sortField, sortOrder, metrics.primaryUnit);
  }

  /**
   * 시트 탭 버튼 목록 렌더링
   */
  function renderSheetTabsList(sheetNames, currentSheet) {
    const tabsContainer = document.getElementById('sheetTabs');
    if (!tabsContainer) return;

    if (!sheetNames || sheetNames.length <= 1) {
      tabsContainer.style.display = 'none';
      return;
    }

    tabsContainer.style.display = 'flex';
    let html = '';
    sheetNames.forEach(name => {
      const isActive = name === currentSheet;
      html += `
        <button class="sheet-tab-btn ${isActive ? 'active' : ''}" data-sheet="${name}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          ${name}
        </button>
      `;
    });
    tabsContainer.innerHTML = html;
  }

  /**
   * 로딩 스피너 제어
   */
  function showLoading(show) {
    const loader = document.getElementById('appLoading');
    if (loader) {
      loader.style.display = show ? 'flex' : 'none';
    }
  }

})();
