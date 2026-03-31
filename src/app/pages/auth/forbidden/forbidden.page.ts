import { Component } from '@angular/core';

@Component({
  selector: 'app-forbidden-page',
  standalone: true,
  template: `
    <div style="text-align:center; padding: 48px">
      <h1>403</h1>
      <p>No tenés permiso para acceder a esta sección.</p>
    </div>
  `,
})
export class ForbiddenPage {}
