// src/app/components/events-list/components/events-pagination/events-pagination.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface PaginationConfig {
  maxVisiblePages: number;
  showFirstLast: boolean;
  showPrevNext: boolean;
}

@Component({
  selector: 'app-events-pagination',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './events-pagination.component.html',
  styleUrls: ['./events-pagination.component.css'],
})
export class EventsPaginationComponent implements OnChanges {
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  @Input() totalElements: number = 0;
  @Input() pageSize: number = 12;
  @Input() config: PaginationConfig = {
    maxVisiblePages: 5,
    showFirstLast: true,
    showPrevNext: true,
  };

  @Output() pageChange = new EventEmitter<number>();

  visiblePages: number[] = [];
  startItem: number = 0;
  endItem: number = 0;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentPage'] || changes['totalPages']) {
      this.calculateVisiblePages();
      this.calculateItemRange();
    }
  }

  private calculateVisiblePages() {
    const total = this.totalPages;
    const current = this.currentPage;
    const maxVisible = this.config.maxVisiblePages;

    if (total <= maxVisible) {
      // Show all pages if total is less than or equal to maxVisible
      this.visiblePages = Array.from({ length: total }, (_, i) => i + 1);
      return;
    }

    const pages: number[] = [];
    const half = Math.floor(maxVisible / 2);

    // Always show first page
    pages.push(1);

    let start = Math.max(2, current - half);
    let end = Math.min(total - 1, current + half);

    // Adjust if we're near the beginning
    if (current <= half + 1) {
      end = Math.min(total - 1, maxVisible - 1);
    }

    // Adjust if we're near the end
    if (current >= total - half) {
      start = Math.max(2, total - maxVisible + 2);
    }

    // Add ellipsis after first page if needed
    if (start > 2) {
      pages.push(-1); // -1 represents ellipsis
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== total) {
        pages.push(i);
      }
    }

    // Add ellipsis before last page if needed
    if (end < total - 1) {
      pages.push(-1); // -1 represents ellipsis
    }

    // Always show last page if there's more than one page
    if (total > 1) {
      pages.push(total);
    }

    this.visiblePages = pages;
  }

  private calculateItemRange() {
    this.startItem = (this.currentPage - 1) * this.pageSize + 1;
    this.endItem = Math.min(
      this.currentPage * this.pageSize,
      this.totalElements
    );
  }

  onPageClick(page: number) {
    if (page !== this.currentPage && page > 0 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  onFirstPage() {
    if (this.currentPage !== 1) {
      this.pageChange.emit(1);
    }
  }

  onLastPage() {
    if (this.currentPage !== this.totalPages) {
      this.pageChange.emit(this.totalPages);
    }
  }

  onPreviousPage() {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  onNextPage() {
    if (this.currentPage < this.totalPages) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  isEllipsis(page: number): boolean {
    return page === -1;
  }

  canGoFirst(): boolean {
    return this.currentPage > 1;
  }

  canGoLast(): boolean {
    return this.currentPage < this.totalPages;
  }

  canGoPrevious(): boolean {
    return this.currentPage > 1;
  }

  canGoNext(): boolean {
    return this.currentPage < this.totalPages;
  }

  getPageAriaLabel(page: number): string {
    if (page === this.currentPage) {
      return `Trang hiện tại ${page}`;
    }
    return `Chuyển đến trang ${page}`;
  }

  getPageButtonClass(page: number): string {
    if (this.isEllipsis(page)) {
      return 'page-button ellipsis-button';
    }
    if (page === this.currentPage) {
      return 'page-button active';
    }
    return 'page-button';
  }

  trackByPage(index: number, page: number): number {
    return page;
  }
}
