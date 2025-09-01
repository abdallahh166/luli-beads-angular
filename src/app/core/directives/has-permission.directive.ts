// src/app/core/directives/has-permission.directive.ts

import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  @Input() hasPermission: string = '';
  @Input() hasPermissionElse?: TemplateRef<any>;

  private destroy$ = new Subject<void>();

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(authState => {
        this.updateView(authState.profile ? 
          this.authService.hasPermission(this.hasPermission) : false
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateView(hasPermission: boolean): void {
    this.viewContainer.clear();
    
    if (hasPermission) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else if (this.hasPermissionElse) {
      this.viewContainer.createEmbeddedView(this.hasPermissionElse);
    }
  }
}

// Usage in template:
// <div *hasPermission="'admin:users'">Admin only content</div>
// <div *hasPermission="'edit:profile'; else notAllowed">Edit profile</div>
// <ng-template #notAllowed>You don't have permission</ng-template>