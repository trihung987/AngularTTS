import { Component, signal, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from "./core/components/footer/footer.component";
import { HeaderComponent } from "./core/components/header/header.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  encapsulation: ViewEncapsulation.None, ////Phạm vi áp dụng của css - emulated = chỉ host component, None = toàn cục
})
export class App {
  protected readonly title = signal('projectDemoTTS');
}
