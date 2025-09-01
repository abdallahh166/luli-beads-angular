// src/app/core/directives/has-role.directive.ts

import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../interfaces/auth.interface';

@Directive({
  selector: '[hasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit, OnDestroy {
  @Input() hasRole: UserRole | UserRole[] = UserRole.USER;
  @Input() hasRoleElse?: TemplateRef<any>;

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
        const hasRole = this.checkRole();
        this.updateView(hasRole);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkRole(): boolean {
    if (Array.isArray(this.hasRole)) {
      return this.hasRole.some(role => this.authService.hasRole(role));
    }
    return this.authService.hasRole(this.hasRole);
  }

  private updateView(hasRole: boolean): void {
    this.viewContainer.clear();
    
    if (hasRole) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else if (this.hasRoleElse) {
      this.viewContainer.createEmbeddedView(this.hasRoleElse);
    }
  }
}

// Usage in template:
// <div *hasRole="UserRole.ADMIN">Admin only content</div>
// <div *hasRole="[UserRole.ADMIN, UserRole.MODERATOR]">Admin or Moderator content</div>