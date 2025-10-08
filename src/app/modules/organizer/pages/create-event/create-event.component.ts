import { EventData } from './../../services/events.service';
import { HttpService } from './../../../../shared/services/http.service';
import { ToastrService } from 'ngx-toastr';
// create-event.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  query,
  stagger,
} from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';

// Import step components
import { CreateEventService} from '../../services/events.service';
import { Step1InfoComponent } from '../../components/step-create/step1-info/step1-info.component';
import { Step2TimeComponent } from '../../components/step-create/step2-time/step2-time.component';
import { Step4PaymentComponent } from '../../components/step-create/step4-payment/step4-payment.component';
import { Step3ZoneComponent } from '../../components/step-create/step3-zone/step3-zone.component';
import { ScrollTop } from "primeng/scrolltop";

interface StepConfig {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  completed: boolean;
  active: boolean;
  component: any;
}

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [
    CommonModule,
    Step1InfoComponent,
    Step2TimeComponent,
    Step3ZoneComponent,
    Step4PaymentComponent,
    ScrollTop
],
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate(
          '400ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ transform: 'translateX(0%)', opacity: 1 })
        ),
      ]),
      transition(':leave', [
        animate(
          '300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ transform: 'translateX(-100%)', opacity: 0 })
        ),
      ]),
    ]),
    trigger('stepProgress', [
      transition('* => *', [
        query(
          '.step-progress',
          [
            style({ width: '0%' }),
            animate(
              '600ms cubic-bezier(0.4, 0, 0.2, 1)',
              style({ width: '{{width}}%' })
            ),
          ],
          { optional: true }
        ),
      ]),
    ]),
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate(
          '500ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
  ],
})
export class CreateEventComponent implements OnInit, OnDestroy {
  @ViewChild(Step1InfoComponent)
  private step1Component!: Step1InfoComponent;
  @ViewChild(Step2TimeComponent)
  private step2Component!: Step2TimeComponent;
  @ViewChild(Step3ZoneComponent)
  private step3Component!: Step3ZoneComponent;
  @ViewChild(Step4PaymentComponent)
  private step4Component!: Step4PaymentComponent;

  private destroy$ = new Subject<void>();
  currentStep = 1;
  totalSteps = 4;
  private eventId: string | null = null;
  isLoading = false;

  steps: StepConfig[] = [
    {
      id: 1,
      title: 'Thông tin sự kiện',
      subtitle: 'Tên, hình ảnh và mô tả sự kiện',
      icon: 'info',
      completed: false,
      active: true,
      component: Step1InfoComponent,
    },
    {
      id: 2,
      title: 'Thời gian diễn ra',
      subtitle: 'Lịch trình sự kiện',
      icon: 'clock',
      completed: false,
      active: false,
      component: Step2TimeComponent,
    },
    {
      id: 3,
      title: 'Sơ đồ chỗ ngồi',
      subtitle: 'Thiết kế zone và ghế',
      icon: 'layout',
      completed: false,
      active: false,
      component: Step3ZoneComponent,
    },
    {
      id: 4,
      title: 'Thông tin thanh toán',
      subtitle: 'Tài khoản nhận tiền',
      icon: 'credit-card',
      completed: false,
      active: false,
      component: Step4PaymentComponent,
    },
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private createEventService: CreateEventService,
    private toastrService: ToastrService,
    private changeDetectionRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const currentPath = this.route.routeConfig?.path;
    // Kiểm tra id
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params.get('id');

      if (currentPath === 'edit-event/:id') {
        // Trường hợp route là edit
        if (id) {
          this.eventId = id;
          this.loadEventData(id);
        } else {
          //Không có id thì redirect to create thay vì url edit

          this.createEventService.resetEventData();
          this.router.navigate(['/organizer/create-event'], {
            replaceUrl: true,
          });
        }
      } else if (currentPath === 'create-event') {
        // Trường hợp route là create
        this.createEventService.resetEventData();
      }
    });

    this.createEventService.stepCompletion$
      .pipe(takeUntil(this.destroy$))
      .subscribe((completionStatus) => {
        //Bỏ trong set timout để tránh lỗi ERROR RuntimeError: NG0100: ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after
        // khi 1 giá trị cập nhập ngay khi giao diện vừa render của createEvent
        setTimeout(() => {
          this.updateStepCompletion(completionStatus);
          this.changeDetectionRef.detectChanges();
        }, 0);
      });
  }

  //load data from id
  private recalculateStepCompletion(): void {
    setTimeout(() => {


      const step1Complete = this.step1Component?.validateStep(false) ?? false;
      const step2Complete = this.step2Component?.validateStep(false) ?? false;
      const step3Complete =
        this.step3Component?.validateAndEmitStepComplete(false) ?? false;
      const step4Complete = this.step4Component?.validateStep(false) ?? false;
      const eventData = this.createEventService.getCurrentEventData();

      // đánh dấu hoàn thành hay không từ data load ra được nếu stepComponent null (chưa render)
      const validateEarlyStep1 = !!eventData.eventName;
      const validateEarlyStep2 = !!eventData.startDate;
      const validateEarlyStep3 = !!eventData.zones && eventData.zones.length > 0;
      const validateEarlyStep4 = !!eventData.bankInfo;
      console.log('result load data step complete', validateEarlyStep1, validateEarlyStep2, validateEarlyStep3, validateEarlyStep4);
      this.createEventService.setStepCompletion(1, this.step1Component != null? step1Complete : validateEarlyStep1);
      this.createEventService.setStepCompletion(2, this.step2Component != null? step2Complete : validateEarlyStep2);
      this.createEventService.setStepCompletion(3, this.step3Component != null? step3Complete : validateEarlyStep3);
      this.createEventService.setStepCompletion(4, this.step4Component != null? step4Complete : validateEarlyStep4);
      const lastStep = validateEarlyStep4 ? 4 : validateEarlyStep3 ? 3 : validateEarlyStep2 ? 2 : 1;

      setTimeout(() => {
         this.goToStep(lastStep);
      }, 50);
    }, 0);
  }

  private loadEventData(id: string) {
    this.isLoading = true;
    this.createEventService.getEventById(id).subscribe(
      async (eventData) => {
        const [eventImageFile, eventBannerFile, organizerLogoFile] =
          await Promise.all([
            eventData.eventImage
              ? this.createEventService.urlToFile(
                  eventData.eventImage as any,
                  'eventImage.jpg'
                )
              : null,
            eventData.eventBanner
              ? this.createEventService.urlToFile(
                  eventData.eventBanner as any,
                  'eventBanner.jpg'
                )
              : null,
            eventData.organizer?.logo
              ? this.createEventService.urlToFile(
                  eventData.organizer.logo as any,
                  'organizerLogo.jpg'
                )
              : null,
          ]);

        const fullEventData: Partial<EventData> = {
          ...eventData,
          eventImage: eventImageFile,
          eventBanner: eventBannerFile,
          organizer: { ...eventData.organizer, logo: organizerLogoFile } as any,
        };
        console.log('EVENTS DATA:', fullEventData);
        this.createEventService.updateEventData(fullEventData);

        this.recalculateStepCompletion();

        this.isLoading = false;
      },
      (error) => {
        this.isLoading = false;
        this.toastrService.error(
          `Không tìm thấy event. Vui lòng thử lại sau`,
          'Error'
        );
        this.router.navigate(['/organizer/events']);
      }
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get progressPercentage(): number {
    const completedSteps = this.steps.filter((step) => step.completed).length;
    return (completedSteps / this.totalSteps) * 100;
  }

  get currentStepConfig(): StepConfig {
    return (
      this.steps.find((step) => step.id === this.currentStep) || this.steps[0]
    );
  }

  isNotCompleted(): boolean {
  console.log("current", this.currentStep);
  if (this.currentStep === 4) {
    const allPrevCompleted = this.steps
      .slice(0, 3)
      .every(step => step.completed);

    return !allPrevCompleted;
  }
  return true;
}

  canGoToStep(stepId: number): boolean {
    if (stepId === 1) return true;

    for (let i = 1; i < stepId; i++) {
      const step = this.steps.find((s) => s.id === i);
      if (!step || !step.completed) {
        return false;
      }
    }
    return true;
  }

  goToStep(stepId: number) {
    if (stepId === this.currentStep) {
      return;
    }

    if (!this.validateCurrentStep()) {
      this.toastrService.error(
        'Vui lòng hoàn thành đầy đủ thông tin ở bước hiện tại',
        'Không hợp lệ'
      );
      return;
    }
    console.log("go to step", stepId, this.canGoToStep(stepId));
    if (this.canGoToStep(stepId)) {
      this.currentStep = stepId;
      this.updateActiveStep();
      setTimeout(() => {
        this.changeDetectionRef.detectChanges();
      }, 200);
    }
  }

  private validateCurrentStep(fromNext: boolean = true): boolean {
    switch (this.currentStep) {
      case 1:
        return this.step1Component?.validateStep(fromNext) ?? false;
      case 2:
        return this.step2Component?.validateStep(fromNext) ?? false;
      case 3:
        return (
          this.step3Component?.validateAndEmitStepComplete(fromNext) ?? false
        );
      case 4:
        return this.step4Component?.validateStep(fromNext) ?? false;
      default:
        return false;
    }
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      if (this.validateCurrentStep()) {
        // cập nhập complet step này
        const stepConfig = this.steps.find((s) => s.id === this.currentStep);
        if (stepConfig) {
          stepConfig.completed = true;
        }
        this.currentStep++;
        this.updateActiveStep(); //chuyển qua step đang đi đến

        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 200);
      } else {
        this.toastrService.error(
          'Vui lòng hoàn thành đầy đủ thông tin',
          'Không hợp lệ'
        );
      }
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateActiveStep();
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.changeDetectionRef.detectChanges();
      }, 200);
    }
  }

  private updateActiveStep() {
    this.steps.forEach((step) => {
      step.active = step.id === this.currentStep;
    });
  }

  private updateStepCompletion(completionStatus: { [key: number]: boolean }) {
    this.steps.forEach((step) => {
      if (completionStatus[step.id] !== undefined) {
        step.completed = completionStatus[step.id];
      }
    });
  }

  public isCurrentStepValid(): boolean {
    return this.createEventService.isStepValid(this.currentStep);
  }

  onStepComplete(stepId: number, isValid: boolean) {
    this.createEventService.setStepCompletion(stepId, isValid);
  }

  saveAndExit(exit: boolean = false) {
    if (!this.validateCurrentStep(false)) {
      this.toastrService.error(
        'Vui lòng hoàn thành đầy đủ thông tin',
        'Không thể lưu bản nháp'
      );
      return;
    }

    this.createEventService.saveDraft().subscribe({
      next: () => {
        this.toastrService.success(
          'Lưu thành công',
          'Lưu nháp sự kiện thành công!'
        );
        if (exit) this.router.navigate(['/organizer/events']);
      },
      error: (error) => {},
    });
  }

  publishEvent() {
    if (this.currentStep !== 4) return;

    if (
      this.isNotCompleted() ||
      !this.validateCurrentStep()
    ) {
      this.toastrService.error(
        'Vui lòng hoàn thành đầy đủ thông tin',
        'Không hợp lệ'
      );
      return;
    }

    this.createEventService.publishEvent().subscribe({
      next: () => {
        const action = this.eventId ? 'cập nhật và' : '';
        this.toastrService.success(
          `Sự kiện của bạn đã được ${action} đưa vào hàng chờ phê duyệt`,
          'Thành công'
        );
        this.router.navigate(['/organizer/events']);
      },
      error: (err) => {
        this.toastrService.error(
          err.message || 'Đã xảy ra lỗi khi xuất bản. Vui lòng thử lại sau',
          'Lỗi'
        );
      },
    });
  }

  // publishEvent() {
  //   if (this.currentStep !== 4) return;

  //   const isStep4Valid = this.validateCurrentStep();

  //   const allStepsCompleted = this.steps.every((step) => step.completed);

  //   if (isStep4Valid && allStepsCompleted) {
  //     this.createEventService.publishEvent().subscribe(() => {
  //       this.submitDataToServer();
  //       this.toastrService.success(
  //         'Sự kiện của bạn đã được xuất bản',
  //         'Thành công'
  //       );
  //       this.router.navigate(['/organizer/events']);
  //     });
  //   } else {
  //     this.toastrService.error(
  //       'Vui lòng hoàn thành đầy đủ thông tin',
  //       'Không hợp lệ'
  //     );
  //   }
  // }

  submitDataToServer() {
    this.createEventService.publishEvent();
  }
}
