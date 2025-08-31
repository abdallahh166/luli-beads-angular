import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FooterLink {
  name: string;
  href: string;
}

interface FooterLinks {
  shop: FooterLink[];
  customer: FooterLink[];
  company: FooterLink[];
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  newsletterEmail = '';

  footerLinks: FooterLinks = {
    shop: [
      { name: "All Products", href: "#shop" },
      { name: "Evening Bags", href: "#evening" },
      { name: "Classic Collection", href: "#classic" },
      { name: "Premium Line", href: "#premium" },
      { name: "New Arrivals", href: "#new" },
      { name: "Bestsellers", href: "#bestsellers" }
    ],
    customer: [
      { name: "Size Guide", href: "#size-guide" },
      { name: "Care Instructions", href: "#care" },
      { name: "Shipping Info", href: "#shipping" },
      { name: "Returns", href: "#returns" },
      { name: "Track Order", href: "#track" },
      { name: "Contact Us", href: "#contact" }
    ],
    company: [
      { name: "About Us", href: "#about" },
      { name: "Our Story", href: "#story" },
      { name: "Craftsmanship", href: "#craft" },
      { name: "Sustainability", href: "#sustainability" },
      { name: "Press", href: "#press" },
      { name: "Careers", href: "#careers" }
    ]
  };

  subscribeNewsletter(): void {
    if (this.newsletterEmail && this.isValidEmail(this.newsletterEmail)) {
      // TODO: Implement newsletter subscription
      console.log('Newsletter subscription:', this.newsletterEmail);
      this.newsletterEmail = '';
      // Show success message
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
