import { Directive, Input, OnInit, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { PermissionService } from '../../core/providers/permission.service';

/**
 * Directiva estructural que muestra/oculta elementos según permiso efectivo.
 *
 * Uso:
 *   <button *hasPermission="'inventory.movements.create'">Nuevo movimiento</button>
 *
 * IMPORTANTE: esto es UX, no seguridad. El backend siempre valida.
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnInit {
  @Input('hasPermission') permission!: string;

  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissionService = inject(PermissionService);

  ngOnInit(): void {
    if (this.permissionService.can(this.permission)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
