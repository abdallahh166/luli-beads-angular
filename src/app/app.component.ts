import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { CartSyncStatusComponent } from './shared/components/cart-sync-status/cart-sync-status.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, CartSyncStatusComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Luli Beads Atelier';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Initialize auth service when app starts
    this.authService.initializeAuth();
  }
}
