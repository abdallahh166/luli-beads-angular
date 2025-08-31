import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  formData: FormData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };
  isSubmitting = false;

  onSubmit(): void {
    if (this.formData.name && this.formData.email && this.formData.subject && this.formData.message) {
      this.isSubmitting = true;
      
      // Simulate form submission
      setTimeout(() => {
        console.log('Contact form submitted:', this.formData);
        this.isSubmitting = false;
        // Reset form
        this.formData = {
          name: '',
          email: '',
          subject: '',
          message: ''
        };
        // Show success message (you could implement a toast service here)
        alert('Thank you for your message! We\'ll get back to you soon.');
      }, 2000);
    }
  }

  openWhatsApp(): void {
    const message = encodeURIComponent('Hello! I\'m interested in your handcrafted beaded bags.');
    window.open(`https://wa.me/15551234567?text=${message}`, '_blank');
  }
}
