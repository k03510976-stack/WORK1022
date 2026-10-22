/**
 * parser.js
 * 엑셀(xlsx, xls) 및 CSV 파일 파싱 및 데이터 정규화 모듈
 */

(function (window) {
  'use strict';

  const Parser = {
    /**
     * 문자열에서 숫자 추출 (쉼표, +, 억 원 등 제거, 세모 △ 음수 처리)
     */
    parseNumber(val) {
      if (val === null || val === undefined) return 0;
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      
      let s = String(val).trim();
      if (!s || s === '-' || s === '·' || s === '0' || s === '신규' || s === '순증') return 0;

      // 조/억 단위 텍스트인 경우 처리 (예: "9조 222억원" -> 90222)
      if (s.includes('조') && s.includes('억')) {
        const joMatch = s.match(/([0-9,.]+)\s*조/);
        const eokMatch = s.match(/([0-9,.]+)\s*억/);
        let totalEok = 0;
        if (joMatch) totalEok += parseFloat(joMatch[1].replace(/,/g, '')) * 10000;
        if (eokMatch) totalEok += parseFloat(eokMatch[1].replace(/,/g, ''));
        return totalEok;
      } else if (s.endsWith('조원') || s.endsWith('조')) {
        const m = s.match(/([0-9,.]+)/);
        if (m) return parseFloat(m[1].replace(/,/g, '')) * 10000;
      }

      // 음수 부호 처리 (△, ▲, -)
      let isNegative = false;
      if (s.startsWith('△') || s.startsWith('▲') || s.startsWith('-')) {
        isNegative = true;
      }
      
      // 숫자 및 소수점만 추출
      let clean = s.replace(/[^0-9.]/g, '');
      let num = parseFloat(clean);
      if (isNaN(num)) return 0;
      return isNegative ? -num : num;
    },

    /**
     * 증가율 문자열 정규화 (예: "+34.9%" -> 34.9, "신규" -> "신규")
     */
    parseRate(val, prevVal, currVal) {
      if (val === null || val === undefined) {
        if (prevVal === 0 && currVal > 0) return '신규';
        return 0;
      }
      let s = String(val).trim();
      if (s === '신규' || s === '순증' || s.includes('신규')) return '신규';
      if (s === '-' || !s) {
        if (prevVal === 0 && currVal > 0) return '신규';
        return 0;
      }

      let isNegative = s.startsWith('△') || s.startsWith('▲') || s.startsWith('-');
      let clean = s.replace(/[^0-9.]/g, '');
      let num = parseFloat(clean);
      if (isNaN(num)) {
        if (prevVal > 0) {
          return parseFloat((((currVal - prevVal) / prevVal) * 100).toFixed(1));
        }
        return 0;
      }
      return isNegative ? -num : num;
    },

    /**
     * 신규 사업 여부 판단
     */
    checkIsNew(item) {
      if (item.growthRate === '신규') return true;
      if (item.prevVal === 0 && item.currVal > 0) return true;
      const textToSearch = (item.projectName + ' ' + (item.description || '')).toLowerCase();
      if (textToSearch.includes('신규') || textToSearch.includes('신설') || textToSearch.includes('착수')) {
        return true;
      }
      return false;
    },

    /**
     * 스마트 헤더 감지: 1~6행 중 가장 적합한 헤더 행 번호(0-indexed)를 찾음
     */
    findHeaderRowIndex(rawSheetRows) {
      if (!rawSheetRows || rawSheetRows.length === 0) return 0;
      const targetKeywords = ['연번', '번호', '분야', '중점', '사업', '항목', '2026', '2027', '예산', '정부안', '증감', '증가율', '증감률', '단위', '내용'];
      
      let bestIndex = 0;
      let maxMatches = -1;

      const scanLimit = Math.min(rawSheetRows.length, 6);
      for (let r = 0; r < scanLimit; r++) {
        const row = rawSheetRows[r];
        if (!row || !Array.isArray(row)) continue;
        
        let matchCount = 0;
        const rowString = row.join(' ').toLowerCase();
        for (const kw of targetKeywords) {
          if (rowString.includes(kw)) {
            matchCount++;
          }
        }

        if (matchCount > maxMatches) {
          maxMatches = matchCount;
          bestIndex = r;
        }
      }

      return bestIndex;
    },

    /**
     * 헤더 배열로부터 각 표준 컬럼의 인덱스 매핑 생성
     */
    createColumnMap(headers) {
      const colMap = {
        id: -1,
        category: -1,
        projectName: -1,
        unit: -1,
        prevVal: -1,
        currVal: -1,
        diffVal: -1,
        growthRate: -1,
        description: -1
      };

      headers.forEach((h, idx) => {
        if (!h) return;
        const str = String(h).trim().replace(/\r?\n/g, ' ');

        if (colMap.id === -1 && /^(연번|번호|no|사업번호)$/i.test(str)) {
          colMap.id = idx;
        } else if (colMap.category === -1 && (str.includes('분야') || str.includes('중점') || str.includes('대분류') || str.includes('부문') || str.includes('소관') || str.includes('기관'))) {
          colMap.category = idx;
        } else if (colMap.projectName === -1 && (str.includes('세부') || str.includes('사업') || str.includes('주요 지표') || str.includes('항목') || str.includes('프로그램'))) {
          colMap.projectName = idx;
        } else if (colMap.unit === -1 && (str.includes('단위') || str.includes('구분'))) {
          colMap.unit = idx;
        } else if (colMap.prevVal === -1 && (str.includes('2026') || str.includes('(A)') || str.includes('전년'))) {
          colMap.prevVal = idx;
        } else if (colMap.currVal === -1 && (str.includes('2027') || str.includes('(B)') || str.includes('정부안') || str.includes('금년'))) {
          colMap.currVal = idx;
        } else if (colMap.diffVal === -1 && (str.includes('증감') || str.includes('변동액') || str.includes('(B-A)') || str.includes('(B - A)'))) {
          colMap.diffVal = idx;
        } else if (colMap.growthRate === -1 && (str.includes('증가율') || str.includes('증감률') || str.includes('변동률') || str.includes('%'))) {
          colMap.growthRate = idx;
        } else if (colMap.description === -1 && (str.includes('핵심') || str.includes('보도자료') || str.includes('근거') || str.includes('요약') || str.includes('비고') || str.includes('특징'))) {
          colMap.description = idx;
        }
      });

      return colMap;
    },

    /**
     * 2차원 배열(Sheet Rows)을 표준 아이템 객체 배열로 정규화
     */
    normalizeRows(rawRows) {
      if (!rawRows || rawRows.length === 0) return [];

      const headerIdx = this.findHeaderRowIndex(rawRows);
      const headers = rawRows[headerIdx].map(c => (c !== null && c !== undefined) ? String(c).trim() : '');
      const colMap = this.createColumnMap(headers);

      const items = [];
      let autoId = 1;

      for (let r = headerIdx + 1; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || row.length === 0) continue;

        // 모든 셀이 비어있는 행 제외
        const rowText = row.filter(x => x !== null && x !== undefined && String(x).trim() !== '').join('');
        if (!rowText) continue;

        const getVal = (idx) => (idx !== -1 && row[idx] !== undefined && row[idx] !== null) ? String(row[idx]).trim() : '';

        let category = getVal(colMap.category) || '기타';
        let projectName = getVal(colMap.projectName);
        if (!projectName) {
          // 사업명이 없으면 두번째 컬럼이나 내용 참조
          projectName = getVal(1) || getVal(2) || `사업 #${autoId}`;
        }

        let unit = getVal(colMap.unit) || '억 원';
        let prevValRaw = getVal(colMap.prevVal);
        let currValRaw = getVal(colMap.currVal);
        let diffValRaw = getVal(colMap.diffVal);
        let rateRaw = getVal(colMap.growthRate);
        let description = getVal(colMap.description) || getVal(colMap.projectName);

        let prevVal = this.parseNumber(prevValRaw);
        let currVal = this.parseNumber(currValRaw);
        
        let diffVal = 0;
        if (diffValRaw && diffValRaw !== '순증' && diffValRaw !== '신규') {
          diffVal = this.parseNumber(diffValRaw);
        } else {
          diffVal = currVal - prevVal;
        }

        let growthRate = this.parseRate(rateRaw, prevVal, currVal);

        const id = getVal(colMap.id) || String(autoId);
        autoId++;

        const item = {
          id: id,
          category: category,
          projectName: projectName,
          unit: unit,
          prevVal: prevVal,
          currVal: currVal,
          diffVal: diffVal,
          growthRate: growthRate,
          description: description,
          raw: row
        };

        item.isNew = this.checkIsNew(item);
        item.isIncreased = diffVal > 0;
        item.isDecreased = diffVal < 0;

        items.push(item);
      }

      return items;
    },

    /**
     * 브라우저에서 File(xlsx, xls, csv) 파싱
     */
    async parseFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const isCsv = file.name.endsWith('.csv');

        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {
              type: 'array',
              cellDates: true,
              raw: false
            });

            const sheets = {};
            workbook.SheetNames.forEach(sheetName => {
              const worksheet = workbook.Sheets[sheetName];
              // 헤더 포함 2차원 배열로 변환
              const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
              sheets[sheetName] = Parser.normalizeRows(jsonRows);
            });

            resolve({
              fileName: file.name,
              sheetNames: workbook.SheetNames,
              sheets: sheets
            });
          } catch (err) {
            reject(err);
          }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
      });
    },

    /**
     * 내장 샘플 데이터(DEFAULT_SAMPLE_DATA) 파싱
     */
    parseSampleData(sampleDataObj) {
      const sheets = {};
      const sheetNames = Object.keys(sampleDataObj);

      sheetNames.forEach(sheetName => {
        const rowObjects = sampleDataObj[sheetName];
        if (!Array.isArray(rowObjects) || rowObjects.length === 0) {
          sheets[sheetName] = [];
          return;
        }

        // 객체 배열을 2차원 배열 형태로 변환
        const headers = Object.keys(rowObjects[0]);
        const matrix = [headers];
        rowObjects.forEach(obj => {
          const row = headers.map(h => obj[h]);
          matrix.push(row);
        });

        sheets[sheetName] = Parser.normalizeRows(matrix);
      });

      return {
        fileName: '2027년_국방예산_중점투자사업_수치자료.xlsx (기본 탑재)',
        sheetNames: sheetNames,
        sheets: sheets
      };
    }
  };

  window.AppParser = Parser;
})(window);
