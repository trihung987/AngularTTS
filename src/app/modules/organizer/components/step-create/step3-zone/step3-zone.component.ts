// step3-zone.component.ts
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  NgZone,
  OnDestroy,
  Output,
  EventEmitter,
  OnInit,
  HostListener,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CreateEventService,
  EventData,
} from '../../../services/events.service';
import { Subject, takeUntil } from 'rxjs';
import { Zone } from '../../../../../shared/models/zone.model';



@Component({
  selector: 'step3-zone',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step3-zone.component.html',
  styleUrls: ['./step3-zone.component.css'],
})
export class Step3ZoneComponent implements AfterViewInit, OnDestroy, OnInit {
  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  @Output() stepComplete = new EventEmitter<boolean>();

  private destroy$ = new Subject<void>();
  currentEventName: string = 'Sự kiện của tôi';

  showClearDialog: boolean = false;
  showRemoveDialog: boolean = false;

  zones: Zone[] = [
    {
      id: 1,
      name: 'VIP',
      color: '#ff6b6b',
      price: 150,
      shape: 'rectangle',
      isSellable: true,
      coordinates: { x: 100, y: 100, width: 200, height: 150 },
      maxTickets: 100,
      isSeatingZone: true,
      description: 'Khu vực gần sân khấu nhất',
      rotation: 0,
    },
    {
      id: 2,
      name: 'Premium',
      color: '#4ecdc4',
      price: 100,
      shape: 'rectangle',
      isSellable: true,
      coordinates: { x: 350, y: 200, width: 180, height: 120 },
      maxTickets: 150,
      isSeatingZone: true,
      description: 'Tầm nhìn tốt',
      rotation: 0,
    },
    {
      id: 3,
      name: 'Standard',
      color: '#45b7d1',
      price: 50,
      shape: 'rectangle',
      isSellable: true,
      coordinates: { x: 600, y: 150, width: 150, height: 200 },
      maxTickets: 200,
      isSeatingZone: false,
      description: 'Khu vực đứng',
      rotation: 0.2,
    },
  ];

  newZone = {
    name: '',
    color: '#ff6b6b',
    price: 0,
    isSellable: true,
    shape: 'rectangle' as
      | 'rectangle'
      | 'circle'
      | 'polygon'
      | 'ellipse'
      | 'triangle',
    maxTickets: 50,
    isSeatingZone: true,
    description: '',
    rotation: 0,
  };

  selectedZone: Zone | null = null;
  editingZone: Zone | null = null;
  tool: 'zone' | 'select' = 'select';

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private startX = 0;
  private startY = 0;
  private nextZoneId = 4;
  private resizeObserver!: ResizeObserver;

  // Drag and drop properties
  private draggingZone: Zone | null = null;
  private offsetX = 0;
  private offsetY = 0;
  private originalZoneCoords: any = null;
  private isRotating = false; // <-- NEW: Flag for rotation action
  private rotationCenter: { x: number; y: number } | null = null; // <-- NEW: Center point for rotation calculation

  // ### START: Panning and Zooming Properties ###
  private scale = 1;
  private panOffset = { x: 0, y: 0 };
  private isPanning = false;
  private lastPanPoint = { x: 0, y: 0 };
  private minZoom = 0.2;
  private maxZoom = 5;
  // Store the bound listener function to correctly remove it later
  private wheelListener = this.onWheel.bind(this);
  // ### END: Panning and Zooming Properties ###

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone,
    private createEventService: CreateEventService
  ) {}

  ngOnInit() {
    this.createEventService.eventData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((eventData) => {
        this.currentEventName = eventData.eventName || 'Sự kiện của tôi';
      });
    this.loadExistingLayoutData();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeCanvas();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.resizeObserver && this.canvas) {
      this.resizeObserver.unobserve(this.canvas);
    }
    // ### START: Cleanup Pan/Zoom Listener ###
    if (this.canvas) {
      this.canvas.removeEventListener('wheel', this.wheelListener);
    }
    // ### END: Cleanup Pan/Zoom Listener ###
  }

  private loadExistingLayoutData() {
    const currentData = this.createEventService.getCurrentEventData();
    if (currentData.zones && currentData.zones.length > 0) {
      this.zones = [...currentData.zones];
      this.nextZoneId = Math.max(...this.zones.map((z) => z.id)) + 1;
    }
    this.validateAndEmitStepComplete();
  }

  private saveLayoutData() {
    const sellableZones = this.zones.filter((z) => z.isSellable ?? true);
    const totalCapacity = sellableZones.reduce(
      (sum, zone) => sum + (zone.maxTickets || 0),
      0
    );
    const totalRevenue = sellableZones.reduce(
      (sum, zone) => sum + (zone.maxTickets || 0) * zone.price,
      0
    );

    this.createEventService.updateEventData({
      zones: this.zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        color: zone.color,
        price: zone.price,
        shape: zone.shape,
        isSellable: zone.isSellable ?? true,
        coordinates: zone.coordinates,
        maxTickets: zone.maxTickets || 0,
        isSeatingZone: zone.isSeatingZone ?? true,
        description: zone.description || '',
        rotation: zone.rotation, // Save rotation
        totalRevenue: (zone.maxTickets || 0) * zone.price,
      })),
      totalSeats: totalCapacity,
      totalRevenue,
    });
  }

  public validateAndEmitStepComplete(fromNext: boolean = true) {
    this.saveLayoutData();
    console.log("step 3")
    const hasValidLayout = this.zones.length > 0;
    const hasSellableZones = this.zones.some((z) => z.isSellable ?? true);
    const hasCapacity = this.zones
      .filter((z) => z.isSellable)
      .every((z) => (z.maxTickets || 0) > 0);
    const isValid = hasValidLayout && (!hasSellableZones || hasCapacity);
    console.log(
      'step 3',
      isValid,
      ' - ',
      !hasSellableZones || hasCapacity,
      ' - ',
      hasSellableZones,
      " - ",
      hasCapacity
    );
    if (fromNext) this.stepComplete.emit(isValid);
    return isValid;
  }

  getShapeLabel(shape: string): string {
    const labels: { [key: string]: string } = {
      rectangle: 'Chữ nhật',
      circle: 'Tròn',
      ellipse: 'Elip',
      triangle: 'Tam giác',
      polygon: 'Lục giác',
    };
    return labels[shape] || shape;
  }

  initializeCanvas(): void {
    if (!this.canvasRef?.nativeElement) {
      console.error('Canvas element not found!');
      return;
    }
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.updateCursor();

    // ### START: Add Wheel Listener for Zooming ###
    this.canvas.addEventListener('wheel', this.wheelListener);
    // ### END: Add Wheel Listener for Zooming ###

    this.resizeObserver = new ResizeObserver(() => {
      this.ngZone.run(() => {
        this.drawCanvas();
      });
    });
    this.resizeObserver.observe(this.canvas);
    console.log('Canvas initialized and ready for drawing');
  }

  // ### START: New Coordinate Transformation Helper ###
  private getMouseWorldCoordinates(event: MouseEvent): {
    x: number;
    y: number;
  } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    // Get mouse position on the scaled canvas
    const canvasX = (event.clientX - rect.left) * scaleX;
    const canvasY = (event.clientY - rect.top) * scaleY;

    // Transform canvas coordinates to world coordinates
    const worldX = (canvasX - this.panOffset.x) / this.scale;
    const worldY = (canvasY - this.panOffset.y) / this.scale;

    return { x: worldX, y: worldY };
  }
  // ### END: New Coordinate Transformation Helper ###

  // ### START: New Wheel Event Handler for Zooming ###
  private onWheel(event: WheelEvent) {
    event.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mouseX = (event.clientX - rect.left) * scaleX; //tọa độ X chính xác tính trong phạm vi canvas không phải full web
    const mouseY = (event.clientY - rect.top) * scaleY; //tọa độ Y chính xác tính trong phạm vi canvas không phải full web

    // The world coordinates of the mouse before zoom
    // vị trí chuột trỏ tới là nằm ở vị trí nào khi ch zoom
    // ví dụ khi chuột vào tâm 0,0 thì khi map thay đổi to lên
    // khoảng cách x, y sẽ ngắn lại, ngược lại thu nhỏ thì x,y sẽ to ra nhưng
    // đối với map canvas thì size sẽ là cố định nên sẽ k có chuyện thay đổi khoảng cách x,y
    // so với tâm
    // vì vậy để tính được vị trí tọa độ chuột khi ch zoom ta có panoffset (độ lệch)
    // bản đồ thu nhỏ hay phóng to hay kéo thả sẽ lệch đi bao nhiêu offset
    // ví dụ ban đầu khoảng cách giả định từ cạnh đến tâm là 10
    //  khi zoom to vị trí tâm ra thì khoảng cách từ cạnh đến tâm sẽ nhỏ lại là 8
    // lúc này ta được offset là 2 khi đó ta có XY k đổi so với sizebox trừ đi offset
    // ta được tọa dộ XY chính xác khi zoom sau khi khoảng cách thu hẹp là 8 là tọa độ chính xác
    // tương tự việc áp dụng tỉ lệ 1:1 trong bản đồ
    // => mouseWorldBefore là tính vị trí tọa độ so với tâm 0, 0 chớ k fai tâm map hiện tại
    const mouseWorldBeforeX = (mouseX - this.panOffset.x) / this.scale;
    const mouseWorldBeforeY = (mouseY - this.panOffset.y) / this.scale;

    //pan offfset là độ lệch của canvas so với lúc ban đầu

    // Calculate new scale
    const zoomFactor = 1.1; //Phóng to/nhỏ = 0.1 lần
    const oldScale = this.scale;
    let newScale =
      event.deltaY < 0 ? oldScale * zoomFactor : oldScale / zoomFactor;
    this.scale = Math.max(this.minZoom, Math.min(this.maxZoom, newScale));
    //event.deltaY là chỉ số lăn chuột
    // nếu < 0 nghĩa là lăn lên (phóng to zoom in)
    // nếu > 0 nghĩa là lăn xuống (thu nhỏ zoom out)

    // Calculate the new pan offset to keep the point under the mouse stationary
    //Giữ nguyên điểm dưới con chuột khi zoom,
    //nếu không tính khi zoom sẽ bị lệch vị trí tâm chuột đang trỏ tới
    this.panOffset.x = mouseX - mouseWorldBeforeX * this.scale;
    this.panOffset.y = mouseY - mouseWorldBeforeY * this.scale;

    this.drawCanvas();
  }
  // ### END: New Wheel Event Handler for Zooming ###

  private updateCursor() {
    if (!this.canvas) return;
    if (this.isPanning) {
      this.canvas.style.cursor = 'grabbing';
      return;
    }
    // NEW: Add cursor for rotation
    if (this.isRotating) {
      this.canvas.style.cursor = 'crosshair'; // A better cursor would be 'grabbing' or a custom rotation icon
      return;
    }
    switch (this.tool) {
      case 'zone':
        this.canvas.style.cursor = 'crosshair';
        break;
      case 'select':
        this.canvas.style.cursor = 'default';
        break;
    }
  }

  addZone() {
    if (!this.newZone.name || !this.newZone.color) return;

    const zone: Zone = {
      id: this.nextZoneId++,
      name: this.newZone.name,
      color: this.newZone.color,
      price: this.newZone.isSellable ? this.newZone.price : 0,
      shape: this.newZone.shape,
      isSellable: this.newZone.isSellable,
      coordinates: this.getDefaultCoordinatesForShape(this.newZone.shape),
      maxTickets: this.newZone.isSellable ? this.newZone.maxTickets : undefined,
      isSeatingZone: this.newZone.isSellable
        ? this.newZone.isSeatingZone
        : undefined,
      description: this.newZone.isSellable
        ? this.newZone.description
        : undefined,
      rotation: 0, // <-- NEW: Initialize rotation
    };

    this.zones.push(zone);
    this.newZone = {
      name: '',
      color: '#ff6b6b',
      price: 0,
      isSellable: true,
      shape: 'rectangle',
      maxTickets: 50,
      isSeatingZone: true,
      description: '',
      rotation: 0,
    };

    this.drawCanvas();
    this.saveLayoutData();
  }

  private getDefaultCoordinatesForShape(shape: string) {
    switch (shape) {
      case 'circle':
        return { x: 150, y: 150, radius: 75 };
      case 'ellipse':
        return { x: 100, y: 100, width: 200, height: 120 };
      case 'triangle':
        return {
          x: 150,
          y: 50,
          points: [
            { x: 150, y: 50 },
            { x: 100, y: 150 },
            { x: 200, y: 150 },
          ],
        };
      case 'polygon':
        return {
          x: 100,
          y: 100,
          points: [
            { x: 100, y: 100 },
            { x: 200, y: 100 },
            { x: 250, y: 150 },
            { x: 200, y: 200 },
            { x: 100, y: 200 },
            { x: 50, y: 150 },
          ],
        };
      default:
        return { x: 50, y: 50, width: 200, height: 150 };
    }
  }

  selectZone(zone: Zone) {
    this.selectedZone = zone;
    this.updateCursor();
  }

  editZone(zone: Zone) {
    this.editingZone = { ...zone, isSellable: zone.isSellable ?? true };
  }

  saveEdit() {
    if (!this.editingZone) return;

    const index = this.zones.findIndex((z) => z.id === this.editingZone!.id);
    if (index !== -1) {
      const originalZone = this.zones[index];

      if (originalZone.shape !== this.editingZone.shape) {
        const boundingBox = this.getZoneBoundingBox(originalZone);
        this.editingZone.coordinates = this.convertCoordinatesForShapeChange(
          this.editingZone.shape,
          boundingBox
        );
      }

      if (!this.editingZone.isSellable) {
        this.editingZone.price = 0;
        this.editingZone.maxTickets = undefined;
        this.editingZone.isSeatingZone = undefined;
        this.editingZone.description = undefined;
      }

      this.zones[index] = { ...this.editingZone };
      this.selectedZone = this.zones[index];
      this.drawCanvas();
      this.saveLayoutData();
    }
    this.editingZone = null;
  }

  private getZoneBoundingBox(zone: Zone): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const coords = zone.coordinates;
    switch (zone.shape) {
      case 'rectangle':
      case 'ellipse':
        return {
          x: coords.x,
          y: coords.y,
          width: coords.width || 0,
          height: coords.height || 0,
        };
      case 'circle':
        const r = coords.radius || 0;
        return {
          x: coords.x - r,
          y: coords.y - r,
          width: 2 * r,
          height: 2 * r,
        };
      case 'triangle':
      case 'polygon':
        if (!coords.points || coords.points.length === 0) {
          return {
            x: coords.x,
            y: coords.y,
            width: coords.width || 0,
            height: coords.height || 0,
          };
        }
        const minX = Math.min(...coords.points.map((p) => p.x));
        const minY = Math.min(...coords.points.map((p) => p.y));
        const maxX = Math.max(...coords.points.map((p) => p.x));
        const maxY = Math.max(...coords.points.map((p) => p.y));
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      default:
        return { x: coords.x, y: coords.y, width: 0, height: 0 };
    }
  }

  private convertCoordinatesForShapeChange(
    newShape: Zone['shape'],
    boundingBox: { x: number; y: number; width: number; height: number }
  ): Zone['coordinates'] {
    const { x, y, width, height } = boundingBox;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    switch (newShape) {
      case 'rectangle':
        return { x, y, width, height };
      case 'ellipse':
        return { x, y, width, height };
      case 'circle':
        const radius = Math.min(width, height) / 2;
        return { x: centerX, y: centerY, radius };
      case 'triangle': {
        const points = this.generatePolygonPoints(
          'triangle',
          x,
          y,
          width,
          height
        );
        return { x, y, width, height, points };
      }
      case 'polygon': {
        const points = this.generatePolygonPoints(
          'polygon',
          x,
          y,
          width,
          height
        );
        return { x, y, width, height, points };
      }
    }
  }

  cancelEdit() {
    this.editingZone = null;
  }

  deleteZone(zoneId: number) {
    this.zones = this.zones.filter((z) => z.id !== zoneId);
    if (this.selectedZone?.id === zoneId) {
      this.selectedZone = null;
    }
    this.drawCanvas();
    this.saveLayoutData();
  }

  setTool(tool: 'zone' | 'select') {
    this.tool = tool;
    this.updateCursor();
  }

  showClearConfirmation() {
    this.showClearDialog = true;
  }

  confirmClear() {
    this.zones.forEach((zone) => {
      zone.coordinates = this.getDefaultCoordinatesForShape(zone.shape);
      zone.rotation = 0; // Reset rotation
    });
    this.selectedZone = null;
    this.drawCanvas();
    this.saveLayoutData();
    this.showClearDialog = false;
  }

  cancelClear() {
    this.showClearDialog = false;
  }

  get canRemove(): boolean {
    return this.selectedZone !== null;
  }

  showRemoveConfirmation() {
    if (this.canRemove) {
      this.showRemoveDialog = true;
    }
  }

  confirmRemove() {
    if (this.selectedZone) {
      this.deleteZone(this.selectedZone.id);
    }
    this.showRemoveDialog = false;
  }

  cancelRemove() {
    this.showRemoveDialog = false;
  }

  onMouseDown(event: MouseEvent) {
    // ### START: Panning Logic ###
    // Middle mouse button for panning 0left 1middle 2right
    if (event.button === 1) {
      this.isPanning = true;
      this.lastPanPoint = { x: event.clientX, y: event.clientY };
      this.updateCursor();
      event.preventDefault(); // Prevent default middle-click scroll
      return;
    }
    // ### END: Panning Logic ###

    // ### MODIFIED: Use world coordinates for all interactions ###
    const { x, y } = this.getMouseWorldCoordinates(event);

    if (this.tool === 'zone' && this.selectedZone) {
      this.startX = x;
      this.startY = y;
      this.isDrawing = true;
      return;
    }

    if (this.tool === 'select') {
      // NEW: Check for rotation handle click first
      if (
        this.selectedZone &&
        this.isPointOnRotationHandle(x, y, this.selectedZone)
      ) {
        this.isRotating = true;
        this.draggingZone = null; // Prevent dragging while rotating
        this.rotationCenter = this.getZoneCenter(this.selectedZone);
        this.updateCursor();
        return;
      }

      // Original drag logic
      const zone = this.zones.find((z) => this.isPointInZone(x, y, z));
      if (zone) {
        this.selectZone(zone);
        this.draggingZone = zone;
        this.isRotating = false; // Ensure rotation is off
        this.offsetX = x - zone.coordinates.x;
        this.offsetY = y - zone.coordinates.y;
        this.originalZoneCoords = { ...zone.coordinates };
      } else {
        this.selectedZone = null;
      }
      this.drawCanvas();
    }
  }

  onMouseMove(event: MouseEvent) {
    // ### START: Panning Logic ###
    if (this.isPanning) {
      //Lấy tọa độ chuột (tọa độ tính từ full web trừ cho tọa độ cũ cũng tính từ fullweb)
      const dx = event.clientX - this.lastPanPoint.x;
      const dy = event.clientY - this.lastPanPoint.y;
      // có dc distance = mới trừ cũ
      this.panOffset.x += dx;
      this.panOffset.y += dy;
      this.lastPanPoint = { x: event.clientX, y: event.clientY };
      this.drawCanvas();
      return;
    }
    // ### END: Panning Logic ###

    // ### MODIFIED: Use world coordinates for all interactions ###
    const { x, y } = this.getMouseWorldCoordinates(event);

    // NEW: Handle rotation
    if (this.isRotating && this.selectedZone && this.rotationCenter) {
      const angle = Math.atan2(
        y - this.rotationCenter.y,
        x - this.rotationCenter.x
      ); // tính góc giữa tọa độ mà con chuột trỏ tới so với tọa độ tâm của khối shape zone

      //trong canvas góc 0 độ là trục y âm hướng lên nên cần + pi/2 = 90 độ để quay về cơ bản (hợp với trục dương x làm góc 0)
      this.selectedZone.rotation = angle + Math.PI / 2; // Add PI/2 to make 'up' 0 degrees
      this.drawCanvas();
      return;
    }

    if (this.isDrawing && this.tool === 'zone' && this.selectedZone) {
      this.drawCanvas();
      this.drawPreviewZone(this.startX, this.startY, x, y);
    }

    if (this.tool === 'select' && this.draggingZone) {
      const newX = x - this.offsetX;
      const newY = y - this.offsetY;

      const deltaX = newX - this.originalZoneCoords.x;
      const deltaY = newY - this.originalZoneCoords.y;

      this.draggingZone.coordinates.x = newX;
      this.draggingZone.coordinates.y = newY;

      if (
        (this.draggingZone.shape === 'polygon' ||
          this.draggingZone.shape === 'triangle') &&
        this.originalZoneCoords.points
      ) {
        this.draggingZone.coordinates.points =
          this.originalZoneCoords.points.map((p: any) => ({
            x: p.x + deltaX,
            y: p.y + deltaY,
          }));
      }
      this.drawCanvas();
    }
  }

  private drawPreviewZone(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) {
    if (!this.selectedZone) return;

    // ### MODIFIED: Preview drawing is now also transformed via drawCanvas ###
    this.ctx.save();
    this.ctx.translate(this.panOffset.x, this.panOffset.y);
    this.ctx.scale(this.scale, this.scale);

    this.ctx.strokeStyle = this.selectedZone.color;
    this.ctx.lineWidth = 2 / this.scale; // Keep line width consistent when zoomed
    this.ctx.setLineDash([5, 5]);

    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);

    // ... (drawing logic is the same)
    switch (this.selectedZone.shape) {
      case 'rectangle':
        this.ctx.strokeRect(x, y, width, height);
        break;
      case 'circle':
        const radius = Math.min(width, height) / 2;
        this.ctx.beginPath();
        this.ctx.arc(x + width / 2, y + height / 2, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
        break;
      case 'ellipse':
        this.ctx.beginPath();
        this.ctx.ellipse(
          x + width / 2,
          y + height / 2,
          width / 2,
          height / 2,
          0,
          0,
          2 * Math.PI
        );
        this.ctx.stroke();
        break;
      case 'triangle':
        this.ctx.beginPath();
        this.ctx.moveTo(x + width / 2, y);
        this.ctx.lineTo(x, y + height);
        this.ctx.lineTo(x + width, y + height);
        this.ctx.closePath();
        this.ctx.stroke();
        break;
      case 'polygon':
        const rx = width / 2;
        const ry = height / 2;
        const cx = x + width / 2;
        const cy = y + height / 2;

        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const px = cx + rx * Math.cos(angle);
          const py = cy + ry * Math.sin(angle);
          if (i === 0) {
            this.ctx.moveTo(px, py);
          } else {
            this.ctx.lineTo(px, py);
          }
        }
        this.ctx.closePath();
        this.ctx.stroke();
        break;
      default:
        this.ctx.strokeRect(x, y, width, height);
    }
    this.ctx.restore();
  }

  onMouseUp(event: MouseEvent) {
    // ### START: Panning Logic ###
    if (this.isPanning) {
      this.isPanning = false;
      this.updateCursor();
      return;
    }
    // ### END: Panning Logic ###
    const wasInteracting = this.draggingZone || this.isRotating;

    if (this.tool === 'zone' && this.isDrawing && this.selectedZone) {
      // ### MODIFIED: Use world coordinates for all interactions ###
      const { x: endX, y: endY } = this.getMouseWorldCoordinates(event);
      const width = Math.abs(endX - this.startX);
      const height = Math.abs(endY - this.startY);
      if (width > 20 && height > 20) {
        const x = Math.min(this.startX, endX);
        const y = Math.min(this.startY, endY);
        // ... (rest of the logic is the same)
        switch (this.selectedZone.shape) {
          case 'rectangle':
          case 'ellipse':
            this.selectedZone.coordinates = { x, y, width, height };
            break;
          case 'circle':
            const radius = Math.min(width, height) / 2;
            this.selectedZone.coordinates = {
              x: x + width / 2,
              y: y + height / 2,
              radius,
            };
            break;
          case 'triangle':
          case 'polygon':
            this.selectedZone.coordinates = {
              x,
              y,
              width,
              height,
              points: this.generatePolygonPoints(
                this.selectedZone.shape,
                x,
                y,
                width,
                height
              ),
            };
            break;
        }
        this.drawCanvas();
        this.saveLayoutData();
      }
    }

    this.isDrawing = false;
    this.draggingZone = null;
    this.originalZoneCoords = null;
    this.isRotating = false; // <-- NEW
    this.rotationCenter = null; // <-- NEW

    if (wasInteracting) {
      this.saveLayoutData();
    }
  }

  // ... (generatePolygonPoints remains unchanged)
  private generatePolygonPoints(
    shape: 'triangle' | 'polygon',
    x: number,
    y: number,
    width: number,
    height: number
  ): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const cx = x + width / 2;
    const cy = y + height / 2;

    if (shape === 'triangle') {
      points.push({ x: cx, y });
      points.push({ x: x, y: y + height });
      points.push({ x: x + width, y: y + height });
    }

    if (shape === 'polygon') {
      const rx = width / 2;
      const ry = height / 2;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        points.push({
          x: cx + rx * Math.cos(angle),
          y: cy + ry * Math.sin(angle),
        });
      }
    }
    return points;
  }

  onCanvasClick(event: MouseEvent) {
    // This function can be used for quick selection if desired,
    // but onMouseDown already handles selection.
  }

  // ... (isPointInZone and isPointInPolygon remain unchanged)
  private isPointInZone(x: number, y: number, zone: Zone): boolean {
    const center = this.getZoneCenter(zone);

    // To check for a hit on a rotated object, we do the inverse:
    // "un-rotate" the click point around the object's center and then
    // perform a simple, un-rotated hit check.
    const cos = Math.cos(-zone.rotation);
    const sin = Math.sin(-zone.rotation);

    const dx = x - center.x;
    const dy = y - center.y;

    const rotatedX = dx * cos - dy * sin + center.x;
    const rotatedY = dx * sin + dy * cos + center.y;

    // Now check this "un-rotated" point against the original shape coordinates
    const coords = zone.coordinates;
    switch (zone.shape) {
      case 'rectangle':
        return (
          rotatedX >= coords.x &&
          rotatedX <= coords.x + (coords.width || 0) &&
          rotatedY >= coords.y &&
          rotatedY <= coords.y + (coords.height || 0)
        );
      case 'circle':
        const distance = Math.sqrt(
          Math.pow(rotatedX - coords.x, 2) + Math.pow(rotatedY - coords.y, 2)
        );
        return distance <= (coords.radius || 0);
      case 'ellipse':
        const el_dx =
          (rotatedX - (coords.x + (coords.width || 0) / 2)) /
          ((coords.width || 0) / 2);
        const el_dy =
          (rotatedY - (coords.y + (coords.height || 0) / 2)) /
          ((coords.height || 0) / 2);
        return el_dx * el_dx + el_dy * el_dy <= 1;
      case 'triangle':
      case 'polygon':
        if (!coords.points || coords.points.length < 3) return false;
        return this.isPointInPolygon(rotatedX, rotatedY, coords.points);
    }
    return false;
  }

  private isPointInPolygon(
    x: number,
    y: number,
    points: { x: number; y: number }[]
  ): boolean {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      if (
        points[i].y > y !== points[j].y > y &&
        x <
          ((points[j].x - points[i].x) * (y - points[i].y)) /
            (points[j].y - points[i].y) +
            points[i].x
      ) {
        inside = !inside;
      }
    }
    return inside;
  }

  private drawCanvas() {
    if (!this.ctx) return;

    // ### MODIFIED: Apply pan and zoom transformations ###
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    //Dịch chuyển element theo offset (nếu âm thì giảm x,y hiện tại, dương thì tăng lên)
    //  (offset = distance mà mình đã tính được từ việc kéo thả từ vị trí cũ => mới)
    this.ctx.translate(this.panOffset.x, this.panOffset.y);
    this.ctx.scale(this.scale, this.scale);

    this.zones.forEach((zone) => {
      this.drawZoneShape(zone);
    });

    if (this.selectedZone) {
      this.highlightSelectedZone(this.selectedZone);
      this.drawRotationHandle(this.selectedZone); // <-- NEW: Draw handle
    }

    // Restore the context to its original state
    this.ctx.restore();
  }

  private drawZoneShape(zone: Zone) {
    const coords = zone.coordinates;
    const center = this.getZoneCenter(zone);

    this.ctx.save();
    this.ctx.translate(center.x, center.y);
    this.ctx.rotate(zone.rotation);

    this.ctx.fillStyle = zone.color + '40';
    this.ctx.strokeStyle = zone.color;
    // Make line width and font size responsive to zoom
    const baseLineWidth = 2;
    this.ctx.lineWidth = baseLineWidth / this.scale;

    switch (zone.shape) {
      case 'rectangle':
        const w = coords.width || 0;
        const h = coords.height || 0;
        this.ctx.fillRect(-w / 2, -h / 2, w, h);
        this.ctx.strokeRect(-w / 2, -h / 2, w, h);
        break;
      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(0, 0, coords.radius || 0, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
        break;
      case 'ellipse':
        this.ctx.beginPath();
        this.ctx.ellipse(
          0,
          0,
          (coords.width || 0) / 2,
          (coords.height || 0) / 2,
          0,
          0,
          2 * Math.PI
        );
        this.ctx.fill();
        this.ctx.stroke();
        break;
      case 'triangle':
      case 'polygon':
        if (coords.points && coords.points.length >= 3) {
          this.ctx.beginPath();
          const pCenter = this.getZoneCenter({ ...zone, rotation: 0 });
          this.ctx.moveTo(
            coords.points[0].x - pCenter.x,
            coords.points[0].y - pCenter.y
          );
          for (let i = 1; i < coords.points.length; i++) {
            this.ctx.lineTo(
              coords.points[i].x - pCenter.x,
              coords.points[i].y - pCenter.y
            );
          }
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
        }
        break;
    }

    // --- MODIFIED: Draw Text in Center with Adaptive Sizing ---
    this.ctx.fillStyle = '#000';

    const baseWorldFontSize = 18; // Kích thước chữ gốc trong "thế giới" của canvas
    const minScreenFontSize = 10; // Cỡ chữ nhỏ nhất có thể đọc (pixel) trên màn hình
    const maxScreenFontSize = 32; // Cỡ chữ lớn nhất để tránh quá to khi zoom gần

    // Kích thước chữ hiệu quả trên màn hình nếu chỉ scale thông thường
    const effectiveScreenSize = baseWorldFontSize * this.scale;

    let contextFontSize = baseWorldFontSize;
    if (effectiveScreenSize < minScreenFontSize) {
      // Nếu chữ quá nhỏ, tính toán lại cỡ chữ để nó giữ ở mức tối thiểu trên màn hình
      contextFontSize = minScreenFontSize / this.scale;
    } else if (effectiveScreenSize > maxScreenFontSize) {
      // Nếu chữ quá to, tính toán lại để nó giữ ở mức tối đa trên màn hình
      contextFontSize = maxScreenFontSize / this.scale;
    }

    this.ctx.font = `bold ${contextFontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle'; // For vertical centering

    const isSellable = zone.isSellable ?? true;
    const labelText = isSellable ? `${zone.name} - $${zone.price}` : zone.name;

    // Vì canvas đã được dịch chuyển về tâm và xoay,
    // vẽ chữ tại (0, 0) sẽ đặt nó ngay giữa shape.
    this.ctx.fillText(labelText, 0, 0);

    this.ctx.restore();
  }

  private highlightSelectedZone(zone: Zone) {
    const center = this.getZoneCenter(zone);
    this.ctx.save();
    this.ctx.translate(center.x, center.y);
    this.ctx.rotate(zone.rotation);

    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 3 / this.scale; // Adjust line width for zoom
    this.ctx.setLineDash([10 / this.scale, 5 / this.scale]); // Adjust dash for zoom

    // ... (drawing logic is the same)
    const coords = zone.coordinates;
    switch (zone.shape) {
      case 'rectangle':
        const w = coords.width || 0;
        const h = coords.height || 0;
        this.ctx.strokeRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4);
        break;
      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(0, 0, (coords.radius || 0) + 2, 0, 2 * Math.PI);
        this.ctx.stroke();
        break;
      case 'ellipse':
        this.ctx.beginPath();
        this.ctx.ellipse(
          0,
          0,
          (coords.width || 0) / 2 + 2,
          (coords.height || 0) / 2 + 2,
          0,
          0,
          2 * Math.PI
        );
        this.ctx.stroke();
        break;
      case 'triangle':
      case 'polygon':
        if (coords.points && coords.points.length >= 3) {
          const pCenter = this.getZoneCenter({ ...zone, rotation: 0 });
          this.ctx.beginPath();
          this.ctx.moveTo(
            coords.points[0].x - pCenter.x,
            coords.points[0].y - pCenter.y
          );
          for (let i = 1; i < coords.points.length; i++) {
            this.ctx.lineTo(
              coords.points[i].x - pCenter.x,
              coords.points[i].y - pCenter.y
            );
          }
          this.ctx.closePath();
          this.ctx.stroke();
        }
        break;
    }

    this.ctx.restore();
    this.ctx.setLineDash([]);
  }

  // ### NEW HELPER FUNCTIONS FOR ROTATION ###
  private getZoneCenter(zone: Zone): { x: number; y: number } {
    const coords = zone.coordinates;
    switch (zone.shape) {
      case 'rectangle':
      case 'ellipse':
        return {
          x: coords.x + (coords.width || 0) / 2,
          y: coords.y + (coords.height || 0) / 2,
        };
      case 'circle':
        return { x: coords.x, y: coords.y };
      case 'triangle':
      case 'polygon':
        if (coords.points && coords.points.length > 0) {
          const sumX = coords.points.reduce((sum, p) => sum + p.x, 0);
          const sumY = coords.points.reduce((sum, p) => sum + p.y, 0);
          return {
            x: sumX / coords.points.length,
            y: sumY / coords.points.length,
          };
        }
        return { x: coords.x, y: coords.y };
    }
  }

  private getRotationHandlePosition(zone: Zone): { x: number; y: number } {
    const center = this.getZoneCenter(zone);
    const box = this.getZoneBoundingBox(zone);
    const handleDistance = 30 / this.scale;

    // Start with the handle position as if there's no rotation (top-center)
    const initialX = center.x;
    const initialY = center.y - box.height / 2 - handleDistance;

    // Now, rotate this point around the center by the zone's rotation
    const cos = Math.cos(zone.rotation);
    const sin = Math.sin(zone.rotation);
    const dx = initialX - center.x;
    const dy = initialY - center.y;

    const rotatedX = dx * cos - dy * sin + center.x;
    const rotatedY = dx * sin + dy * cos + center.y;

    return { x: rotatedX, y: rotatedY };
  }

  private drawRotationHandle(zone: Zone) {
    const pos = this.getRotationHandlePosition(zone);
    const center = this.getZoneCenter(zone);
    const handleRadius = 8 / this.scale;

    this.ctx.save();
    // Draw line from shape center to handle
    this.ctx.beginPath();
    this.ctx.moveTo(center.x, center.y);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.lineWidth = 2 / this.scale;
    this.ctx.stroke();

    // Draw handle circle
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, handleRadius, 0, 2 * Math.PI);
    this.ctx.fillStyle = 'white';
    this.ctx.fill();
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2 / this.scale;
    this.ctx.stroke();
    this.ctx.restore();
  }

  private isPointOnRotationHandle(x: number, y: number, zone: Zone): boolean {
    const handlePos = this.getRotationHandlePosition(zone);
    const handleRadius = 10 / this.scale; // Use a slightly larger radius for easier clicking
    const dx = x - handlePos.x;
    const dy = y - handlePos.y;
    return dx * dx + dy * dy <= handleRadius * handleRadius;
  }

  exportLayout() {
    const sellableZones = this.zones.filter((z) => z.isSellable ?? true);
    const layout = {
      eventName: this.currentEventName,
      zones: this.zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        color: zone.color,
        price: zone.price,
        shape: zone.shape,
        isSellable: zone.isSellable ?? true,
        coordinates: zone.coordinates,
        maxTickets: zone.maxTickets || 0,
        isSeatingZone: zone.isSeatingZone ?? true,
        description: zone.description || '',
        rotation: zone.rotation,
        totalRevenue: (zone.maxTickets || 0) * zone.price,
      })),
      totalCapacity: sellableZones.reduce(
        (sum, zone) => sum + (zone.maxTickets || 0),
        0
      ),
      totalRevenue: sellableZones.reduce(
        (sum, zone) => sum + (zone.maxTickets || 0) * zone.price,
        0
      ),
    };

    const blob = new Blob([JSON.stringify(layout, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.currentEventName.replace(/\s+/g, '_')}-layout.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
