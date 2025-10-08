// // --- MOCKS FOR SERVICES (Để component có thể chạy độc lập) ---

// import { Component, Injectable } from "@angular/core";
// import { Observable, of } from "rxjs";
// // import { Events } from "../../pages/event-detail/event-detail.component";

// // Đây là giả lập cho EventsListService
// @Injectable({
//   providedIn: 'root',
// })
// export class MockEventsListService {
//   getEvents(params: any): Observable<any> {
//     return of({ content: [], totalElements: 0 });
//   }
// }

// // Đây là giả lập cho CreateEventService
// @Injectable({
//   providedIn: 'root',
// })
// export class MockCreateEventService {
//   // Dữ liệu giả để hiển thị
//   private mockEvent: Events = {
//     id: '12345',
//     eventName: 'SUPERFEST 2025 - Concert Mùa Hè Rực Sáng',
//     eventImage:
//       'https://salt.tkbcdn.com/ts/ds/fb/eb/66/1d976574a7ad259eb46ec5c6cfeaf63e.png',
//     eventBanner:
//       'https://salt.tkbcdn.com/ts/ds/fb/eb/66/1d976574a7ad259eb46ec5c6cfeaf63e.png',
//     eventCategory: 'Music',
//     eventDescription: `
//       <p><b style="color: red;">* Cổng bán vé chính thức mở lúc 13:15 ngày 21.08.2025</b></p>
//       <p><b>SUPERFEST 2025 – CONCERT MÙA HÈ RỰC SÁNG</b></p>
//       <p>20 nghệ sĩ, 1 concert, 1 mùa hè bất tận và đầy cảm xúc!</p>
//       <p>Đại tiệc âm nhạc bùng nổ nhất chính thức trở lại tại Hà Nội với phiên bản nâng cấp chưa từng có – nơi ánh sáng, âm nhạc và cảm xúc cùng chạm đỉnh!</p>
//       <img src="https://salt.tkbcdn.com/ts/ds/34/ff/82/92737b672b1748c88095f1d80eda168b.jpg" alt="" width="100%">
//     `,
//     venue: {
//       name: 'Trung tâm Triển lãm Việt Nam (VEC)',
//       address: '3VQ8+24C, Xã Đông Hội, Huyện Đông Anh, Thành Phố Hà Nội',
//     },
//     organizer: {
//       name: 'Vi21 MEDIA',
//       bio: 'CÔNG TY CỔ PHẦN SỰ KIỆN VÀ TRUYỀN THÔNG VIỆT 21 (Vi21 MEDIA)',
//       logo: 'https://salt.tkbcdn.com/ts/ds/59/70/88/7513220e7c6a4ec88e9cd788f7e8fa03.jpg',
//     },
//     startDate: '2025-10-17',
//     endDate: '2025-10-17',
//     startTime: '19:30',
//     endTime: '23:30',
//     slug: 'superfest-2025',
//     totalSeats: 1000,
//     totalRevenue: 2500000000,
//     status: 'PUBLISHED',
//     zones: [
//       {
//         id: 1,
//         name: 'Kỳ Quan',
//         color: '#ff6b6b',
//         price: 3500000,
//         shape: 'rectangle',
//         isSellable: true,
//         coordinates: { x: 100, y: 100, width: 200, height: 150 },
//         maxTickets: 100,
//         isSeatingZone: true,
//         rotation: 0.1,
//       },
//       {
//         id: 2,
//         name: 'Ngôi Sao',
//         color: '#4ecdc4',
//         price: 2800000,
//         shape: 'rectangle',
//         isSellable: true,
//         coordinates: { x: 350, y: 200, width: 180, height: 120 },
//         maxTickets: 150,
//         isSeatingZone: true,
//         rotation: -0.2,
//       },
//       {
//         id: 3,
//         name: 'Tỏa Sáng',
//         color: '#45b7d1',
//         price: 1800000,
//         shape: 'rectangle',
//         isSellable: true,
//         coordinates: { x: 600, y: 150, width: 150, height: 200 },
//         maxTickets: 200,
//         isSeatingZone: false,
//         rotation: 0,
//       },
//       {
//         id: 4,
//         name: 'Sân khấu',
//         color: '#8395a7',
//         price: 0,
//         shape: 'polygon',
//         isSellable: false,
//         coordinates: {
//           x: 350,
//           y: 450,
//           points: [
//             { x: 350, y: 450 },
//             { x: 550, y: 450 },
//             { x: 580, y: 500 },
//             { x: 320, y: 500 },
//           ],
//         },
//         rotation: 0,
//       },
//     ],
//   };

//   getEventById(id: string): Observable<Events> {
//     console.log(`MockService: Fetching event with id: ${id}`);
//     return of(this.mockEvent);
//   }
// }
