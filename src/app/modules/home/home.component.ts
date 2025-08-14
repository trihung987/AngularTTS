import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  price: string;
  image: string;
  attendees: number;
  rating: number;
  category: string;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, RouterModule, NgOptimizedImage],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  encapsulation: ViewEncapsulation.Emulated //Phạm vi áp dụng của css - emulated = chỉ host component, None = toàn cục
})
export class HomeComponent {
  searchQuery = '';

  featuredEvents: Event[] = [
    {
      id: 1,
      title: 'Tech Conference Vietnam 2025',
      date: '2025-09-15',
      location: 'TP. Hồ Chí Minh',
      price: '500,000 VND',
      image:
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=250&fit=crop',
      attendees: 250,
      rating: 4.8,
      category: 'Công nghệ',
    },
    {
      id: 2,
      title: 'Music Festival Vietnam',
      date: '2025-10-20',
      location: 'Hà Nội',
      price: '800,000 VND',
      image:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop',
      attendees: 500,
      rating: 4.9,
      category: 'Âm nhạc',
    },
    {
      id: 3,
      title: 'Startup Meetup & Networking',
      date: '2025-08-25',
      location: 'Đà Nẵng',
      price: '200,000 VND',
      image:
        'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=250&fit=crop',
      attendees: 100,
      rating: 4.7,
      category: 'Kinh doanh',
    },
  ];

  features: Feature[] = [
    {
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      title: 'Thanh toán an toàn',
      description:
        'Hệ thống thanh toán được mã hóa với SSL, hỗ trợ đa dạng phương thức thanh toán online.',
    },
    {
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg>',
      title: 'Check-in QR Code',
      description:
        'Vé điện tử với mã QR, check-in nhanh chóng và chống giả mạo hiệu quả.',
    },
    {
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
      title: 'Real-time Updates',
      description:
        'Cập nhật thông tin sự kiện, số lượng vé còn lại và thông báo quan trọng theo thời gian thực.',
    },
    {
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>',
      title: 'Tìm kiếm thông minh',
      description:
        'Công cụ tìm kiếm AI giúp gợi ý sự kiện phù hợp với sở thích và vị trí của bạn.',
    },
    {
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
      title: 'Quản lý dễ dàng',
      description:
        'Dashboard trực quan cho ban tổ chức, theo dõi doanh thu và quản lý người tham gia.',
    },
    {
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z"/></svg>',
      title: 'Hỗ trợ 24/7',
      description:
        'Đội ngũ hỗ trợ khách hàng chuyên nghiệp, sẵn sàng giải đáp mọi thắc mắc của bạn.',
    },
  ];

  categories = [
    {
      name: 'Âm nhạc',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>',
      gradient: 'from-pink-500 to-red-500',
    },
    {
      name: 'Công nghệ',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 1v2h12v-2l-1-1h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z"/></svg>',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      name: 'Thể thao',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM13 17h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>',
      gradient: 'from-green-500 to-teal-500',
    },
    {
      name: 'Kinh doanh',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>',
      gradient: 'from-purple-500 to-indigo-500',
    },
    {
      name: 'Giáo dục',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      name: 'Ẩm thực',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/></svg>',
      gradient: 'from-red-500 to-pink-500',
    },
  ];


  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
