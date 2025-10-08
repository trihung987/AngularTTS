// steps/step4-payment/step4-payment.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import {
  CreateEventService,
  EventData,
} from '../../../services/events.service';
import { RequiredComponent } from "../../../../../shared/components/required/required.component";

@Component({
  selector: 'step4-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, RequiredComponent],
  templateUrl: './step4-payment.component.html',
  styleUrls: ['./step4-payment.component.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate(
          '400ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate(
          '300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateX(0)' })
        ),
      ]),
    ]),
    trigger('cardFlip', [
      transition('* => *', [
        style({ transform: 'rotateY(0deg)' }),
        animate('0.6s ease-in-out', style({ transform: 'rotateY(360deg)' })),
      ]),
    ]),
  ],
})
export class Step4PaymentComponent implements OnInit, OnDestroy {
  @Output() stepComplete = new EventEmitter<boolean>();

  private destroy$ = new Subject<void>();

  eventData: Partial<EventData> = {
    bankInfo: {
      accountHolder: '',
      accountNumber: '',
      bankName: '',
      bankBranch: '',
    },
  };

  // Bank data
  banks: string[] = [];
  filteredBanks: string[] = [];
  isLoadingBanks = false;

  // Form states
  showBankDropdown = false;
  selectedBankIndex = -1;

  // Validation states
  validationErrors: { [key: string]: string } = {};
  isStepValid = false;

  // Account number formatting
  formattedAccountNumber = '';

  constructor(private createEventService: CreateEventService) {}

  ngOnInit() {
    this.loadInitialData();
    this.setupDataBinding();
    this.loadBanks();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public loadInitialData() {
    const savedData = this.createEventService.getCurrentEventData();
    if (savedData && savedData.bankInfo) {
      this.eventData.bankInfo = {
        ...this.eventData.bankInfo,
        ...savedData.bankInfo,
      };

      // Format account number if it exists
      if (this.eventData.bankInfo?.accountNumber) {
        this.formattedAccountNumber = this.formatAccountNumber(
          this.eventData.bankInfo.accountNumber
        );
      }
    }
  }

  private setupDataBinding() {
    const dataChange$ = new Subject<void>();

    dataChange$
      .pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe(() => {
        this.saveData();
        // this.validateStep();
      });

    this.onDataChange = () => dataChange$.next();
  }

  private onDataChange() {
    // This will be overridden in setupDataBinding
  }

  private loadBanks() {
    this.isLoadingBanks = true;
    this.createEventService
      .getBanks()
      .pipe(takeUntil(this.destroy$))
      .subscribe((banks) => {
        this.banks = banks;
        this.filteredBanks = banks;
        this.isLoadingBanks = false;
      });
  }

  // Bank selection handlers
  onBankNameInputChange(value: string) {
    // ngModel 2 side binding so dont need to set data again
    this.filterBanks(value);
    this.showBankDropdown = value.length > 0;
    this.selectedBankIndex = -1;
    this.onDataChange();
  }

  onBankNameKeydown(event: KeyboardEvent) {
    if (!this.showBankDropdown) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedBankIndex = Math.min(
          this.selectedBankIndex + 1,
          this.filteredBanks.length - 1
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedBankIndex = Math.max(this.selectedBankIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedBankIndex >= 0) {
          this.selectBank(this.filteredBanks[this.selectedBankIndex]);
        }
        break;
      case 'Escape':
        this.showBankDropdown = false;
        this.selectedBankIndex = -1;
        break;
    }
  }

  private filterBanks(query: string) {
    if (!query) {
      this.filteredBanks = this.banks;
      return;
    }

    const lowerQuery = query.toLowerCase();
    this.filteredBanks = this.banks.filter((bank) =>
      bank.toLowerCase().includes(lowerQuery)
    );
  }

  selectBank(bankName: string) {
    this.eventData.bankInfo!.bankName = bankName;
    this.showBankDropdown = false;
    this.selectedBankIndex = -1;

    this.onDataChange();
  }

  onBankNameBlur() {
    // Delay hiding dropdown to allow for click events
    setTimeout(() => {
      this.showBankDropdown = false;
      this.selectedBankIndex = -1;
    }, 150);
  }

  onBankNameFocus() {
    if (this.eventData.bankInfo?.bankName) {
      this.filterBanks(this.eventData.bankInfo.bankName);
      this.showBankDropdown = true;
    }
  }

  // Account number formatting
  onAccountNumberInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove non-digits

    // Limit to reasonable account number length
    if (value.length > 20) {
      value = value.substring(0, 20);
    }

    this.eventData.bankInfo!.accountNumber = value;
    this.formattedAccountNumber = this.formatAccountNumber(value);


    //input.value = this.formattedAccountNumber;
    this.onDataChange();
  }

  private formatAccountNumber(accountNumber: string): string {
    if (!accountNumber) return '';

    // Remove all non-digits
    const digits = accountNumber.replace(/\D/g, '');

    // Format with spaces every 4 digits
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  // Account holder name formatting
  onAccountHolderInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Convert to uppercase and remove special characters except spaces
    value = value.toUpperCase().replace(/[^A-Z\s]/g, '');

    // Limit length
    if (value.length > 50) {
      value = value.substring(0, 50);
    }

    this.eventData.bankInfo!.accountHolder = value;
    input.value = value;
    this.onDataChange();
  }

  // Bank branch input
  onBankBranchInput() {
    this.onDataChange();
  }

  public validateStep(fromNext: boolean = true): boolean {
    this.validationErrors = {};
    let isValid = true;

    // Validate account holder
    if (
      !this.eventData.bankInfo?.accountHolder ||
      this.eventData.bankInfo.accountHolder.trim().length === 0
    ) {
      this.validationErrors['accountHolder'] = 'Tên chủ tài khoản là bắt buộc';
      isValid = false;
      console.log('holder1', isValid);
    } else if (this.eventData.bankInfo.accountHolder.trim().length < 2) {
      this.validationErrors['accountHolder'] =
        'Tên chủ tài khoản phải có ít nhất 2 ký tự';
      isValid = false;
      console.log('holder2', isValid);
    } else if (!/^[A-Z\s]+$/.test(this.eventData.bankInfo.accountHolder)) {
      this.validationErrors['accountHolder'] =
        'Tên chủ tài khoản chỉ được chứa chữ cái viết hoa và khoảng trắng';
      isValid = false;
      console.log('holder3', isValid);
    }

    // Validate account number
    if (
      !this.eventData.bankInfo?.accountNumber ||
      this.eventData.bankInfo.accountNumber.trim().length === 0
    ) {
      this.validationErrors['accountNumber'] = 'Số tài khoản là bắt buộc';
      isValid = false;
      console.log('account num 0', isValid);
    } else if (this.eventData.bankInfo.accountNumber.length < 8) {
      this.validationErrors['accountNumber'] =
        'Số tài khoản phải có ít nhất 8 số';
      isValid = false;
      console.log('account num1', isValid);
    } else if (!/^\d+$/.test(this.eventData.bankInfo.accountNumber)) {
      this.validationErrors['accountNumber'] = 'Số tài khoản chỉ được chứa số';
      isValid = false;
      console.log('account number 2', isValid);
    }

    // Validate bank name
    if (
      !this.eventData.bankInfo?.bankName ||
      this.eventData.bankInfo.bankName.trim().length === 0
    ) {
      this.validationErrors['bankName'] = 'Tên ngân hàng là bắt buộc';
      isValid = false;
    } else if (!this.banks.includes(this.eventData.bankInfo.bankName)) {
      this.validationErrors['bankName'] =
        'Vui lòng chọn ngân hàng từ danh sách';
      isValid = false;
      console.log('ngan hang', isValid);
    }

    // Bank branch is optional but validate if provided
    if (
      this.eventData.bankInfo?.bankBranch &&
      this.eventData.bankInfo.bankBranch.trim().length > 0
    ) {
      if (this.eventData.bankInfo.bankBranch.trim().length < 3) {
        this.validationErrors['bankBranch'] =
          'Chi nhánh phải có ít nhất 3 ký tự';
        isValid = false;
        console.log('chi nhanh', isValid);
      }
    }
    this.isStepValid = isValid;
    if (fromNext) this.stepComplete.emit(isValid);
    console.log("step4", isValid)
    return isValid;
  }

  private saveData() {
    this.createEventService.updateEventData(this.eventData);
  }

  // Utility methods
  getBankIcon(bankName: string): string {
    const bankIcons: { [key: string]: string } = {
      Vietcombank: '🏦',
      BIDV: '🏛️',
      Vietinbank: '🏪',
      Agribank: '🌾',
      ACB: '💳',
      Techcombank: '💻',
      'MB Bank': '💼',
      VPBank: '🏢',
      TPBank: '🏪',
      HDBank: '💎',
    };

    return bankIcons[bankName] || '🏦';
  }

  isValidAccountNumber(): boolean {
    if (!this.eventData.bankInfo?.accountNumber) return false;

    const accountNumber = this.eventData.bankInfo.accountNumber;
    return accountNumber.length >= 8 && /^\d+$/.test(accountNumber);
  }

  // Generate test account info (for demo purposes)
  generateTestAccountInfo() {
    this.eventData.bankInfo = {
      accountHolder: 'NGUYEN VAN A',
      accountNumber: '0123456789',
      bankName: 'Vietcombank',
      bankBranch: 'Chi nhánh Thành phố Hồ Chí Minh',
    };

    this.formattedAccountNumber = this.formatAccountNumber('0123456789');
    this.onDataChange();
  }

  clearPaymentInfo() {
    this.eventData.bankInfo = {
      accountHolder: '',
      accountNumber: '',
      bankName: '',
      bankBranch: '',
    };

    this.formattedAccountNumber = '';
    this.validationErrors = {};
    this.onDataChange();
  }
}
