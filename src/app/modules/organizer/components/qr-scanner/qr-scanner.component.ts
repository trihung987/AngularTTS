import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-qr-scanner-modal',
  standalone: true,
  imports: [
    CommonModule,
    ZXingScannerModule,
    DialogModule,
    ButtonModule,
    CardModule,
    MessageModule,
  ],
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.css'],
})
export class QrScannerModalComponent{
  @Output() scanSuccess = new EventEmitter<string>();
  @Output() closeModal = new EventEmitter<void>();

  visible: boolean = true;
  availableDevices: MediaDeviceInfo[] = [];
  currentDevice: MediaDeviceInfo | undefined;
  hasDevices = false;
  hasPermission = false;
  qrResultString = '';

  allowedFormats = [BarcodeFormat.QR_CODE];

  // ngOnInit(): void {
  //   this.requestCameraPermission();
  // }

  // async requestCameraPermission(): Promise<MediaStream | null> {
  //   try {
  //     const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  //     return stream;
  //   } catch (error) {
  //     console.error('Không thể truy cập camera:', error);
  //     return null;
  //   }
  // }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = Boolean(devices && devices.length);

    const backCamera = devices.find((device) =>
      /back|rear|environment/gi.test(device.label)
    );
    this.currentDevice = backCamera || devices[0];
  }

  onCodeResult(resultString: string): void {
    this.qrResultString = resultString;
    this.scanSuccess.emit(resultString);
  }

  onDeviceSelectChange(device: MediaDeviceInfo): void {
    this.currentDevice = device;
  }

  onHasPermission(has: boolean): void {
    this.hasPermission = has;
  }

  close(): void {
    this.visible = false;
    this.closeModal.emit();
  }

  switchCamera(): void {
    const currentIndex = this.availableDevices.indexOf(this.currentDevice!);
    const nextIndex = (currentIndex + 1) % this.availableDevices.length;
    this.currentDevice = this.availableDevices[nextIndex];
  }
}
