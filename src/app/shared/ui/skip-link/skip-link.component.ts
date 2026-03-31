import { Component } from '@angular/core';

@Component({
  selector: 'ngr-skip-link',
  standalone: true,
  template: `<a href="#main-content" class="skip-link">Saltar al contenido principal</a>`,
  styles: [`
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 9999;
      border-radius: 0 0 4px 0;
    }
    .skip-link:focus {
      top: 0;
    }
  `],
})
export class SkipLinkComponent {}
