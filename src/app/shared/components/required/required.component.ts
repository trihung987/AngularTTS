import { Component, Input } from '@angular/core';

@Component({
  selector: 'line-required',
  imports: [],
  templateUrl: './required.component.html',
  styleUrl: './required.component.css'
})
export class RequiredComponent {
  @Input() label: string = "";

}
