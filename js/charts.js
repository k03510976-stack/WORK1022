/**
 * charts.js
 * Chart.js 기반 분야별/증감율 인포그래픽 차트 렌더링 모듈
 */

(function (window) {
  'use strict';

  // 모던 테마 색상 팔레트
  const PALETTE = [
    '#3b82f6', // Blue
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#8b5cf6', // Violet
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#6366f1', // Indigo
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#84cc16'  // Lime
  ];

  class ChartManager {
    constructor() {
      this.categoryShareChart = null;
      this.categoryDiffChart = null;
    }

    /**
     * 숫자 쉼표 포맷
     */
    formatNumber(num) {
      if (num === null || num === undefined) return '0';
      return Number(num).toLocaleString('ko-KR');
    }

    /**
     * 분야별 예산 비중 도넛 차트 렌더링
     */
    renderCategoryShareChart(canvasId, categoryStats, unit) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      if (this.categoryShareChart) {
        this.categoryShareChart.destroy();
      }

      if (!categoryStats || categoryStats.length === 0) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      // 상위 항목 및 기타 묶기 (최대 7개 + 기타)
      const maxDisplay = 7;
      let displayData = [];
      if (categoryStats.length > maxDisplay) {
        displayData = categoryStats.slice(0, maxDisplay);
        const others = categoryStats.slice(maxDisplay);
        const otherSum = others.reduce((acc, cur) => acc + cur.currVal, 0);
        displayData.push({
          category: '기타 사업군',
          currVal: otherSum
        });
      } else {
        displayData = [...categoryStats];
      }

      const labels = displayData.map(d => {
        // 라벨이 너무 길면 축약
        const name = d.category.replace(/^[①-⑳\d.\s]+/, '');
        return name.length > 14 ? name.substring(0, 13) + '…' : name;
      });
      const dataValues = displayData.map(d => d.currVal);
      const bgColors = labels.map((_, i) => PALETTE[i % PALETTE.length]);

      const totalVal = dataValues.reduce((a, b) => a + b, 0);

      this.categoryShareChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: dataValues,
            backgroundColor: bgColors,
            borderColor: '#0f172a',
            borderWidth: 2,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#94a3b8',
                font: { size: 11, family: 'Pretendard, sans-serif' },
                padding: 12,
                boxWidth: 12,
                boxHeight: 12,
                usePointStyle: true
              }
            },
            tooltip: {
              backgroundColor: '#1e293b',
              titleColor: '#f8fafc',
              bodyColor: '#cbd5e1',
              padding: 10,
              boxPadding: 6,
              cornerRadius: 8,
              callbacks: {
                label: (context) => {
                  const val = context.raw || 0;
                  const pct = totalVal > 0 ? ((val / totalVal) * 100).toFixed(1) : '0';
                  return ` ${context.label}: ${this.formatNumber(val)} ${unit} (${pct}%)`;
                }
              }
            }
          },
          cutout: '68%'
        }
      });
    }

    /**
     * 분야별 증감액 수평 막대 차트 렌더링
     */
    renderCategoryDiffChart(canvasId, categoryStats, unit) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      if (this.categoryDiffChart) {
        this.categoryDiffChart.destroy();
      }

      if (!categoryStats || categoryStats.length === 0) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      // 증감액 절대값 기준 정렬 (최대 8개)
      const sortedByAbsDiff = [...categoryStats]
        .sort((a, b) => Math.abs(b.diffVal) - Math.abs(a.diffVal))
        .slice(0, 8);

      const labels = sortedByAbsDiff.map(d => {
        const name = d.category.replace(/^[①-⑳\d.\s]+/, '');
        return name.length > 12 ? name.substring(0, 11) + '…' : name;
      });
      const dataValues = sortedByAbsDiff.map(d => d.diffVal);
      const bgColors = dataValues.map(v => v >= 0 ? 'rgba(6, 182, 212, 0.85)' : 'rgba(244, 63, 94, 0.85)');
      const borderColors = dataValues.map(v => v >= 0 ? '#06b6d4' : '#f43f5e');

      this.categoryDiffChart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: `증감액 (${unit})`,
            data: dataValues,
            backgroundColor: bgColors,
            borderColor: borderColors,
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#1e293b',
              titleColor: '#f8fafc',
              bodyColor: '#cbd5e1',
              padding: 10,
              boxPadding: 6,
              cornerRadius: 8,
              callbacks: {
                label: (context) => {
                  const val = context.raw || 0;
                  const sign = val > 0 ? '+' : '';
                  return ` 증감: ${sign}${this.formatNumber(val)} ${unit}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(148, 163, 184, 0.1)' },
              ticks: {
                color: '#64748b',
                font: { size: 10 },
                callback: (val) => this.formatNumber(val)
              }
            },
            y: {
              grid: { display: false },
              ticks: {
                color: '#94a3b8',
                font: { size: 11, family: 'Pretendard, sans-serif' }
              }
            }
          }
        }
      });
    }

    /**
     * 모든 차트 일괄 업데이트
     */
    updateAll(categoryStats, unit) {
      this.renderCategoryShareChart('categoryShareChart', categoryStats, unit);
      this.renderCategoryDiffChart('categoryDiffChart', categoryStats, unit);
    }
  }

  window.AppCharts = new ChartManager();
})(window);
