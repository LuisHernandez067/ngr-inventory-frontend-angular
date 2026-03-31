import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SkipLinkComponent } from '../../../shared/ui/skip-link/skip-link.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, MatSidenavModule, MatToolbarModule, SkipLinkComponent],
  template: `
    <ngr-skip-link />

    <mat-sidenav-container class="app-shell">
      <mat-sidenav
        #sidenav
        [opened]="sidenavOpen()"
        mode="side"
        class="app-shell__sidenav">
        <!-- Navigation menu — se poblará en Fase 3+ -->
        <nav aria-label="Navegación principal">
          <p>Navegación</p>
        </nav>
      </mat-sidenav>

      <mat-sidenav-content class="app-shell__content">
        <mat-toolbar class="app-shell__toolbar">
          <span>NGR Inventory</span>
        </mat-toolbar>

        <main id="main-content" role="main" class="app-shell__main">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .app-shell {
      height: 100vh;
    }
    .app-shell__sidenav {
      width: 260px;
    }
    .app-shell__main {
      padding: 24px;
    }
  `],
})
export class AppShellComponent {
  readonly sidenavOpen = signal(true);
}
