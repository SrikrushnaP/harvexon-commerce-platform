import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule],
  template: `
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1>Fresh Vegetables, Delivered Daily</h1>
        <p class="hero-subtext">Farm-fresh produce at your doorstep within hours of harvest.</p>
        <a routerLink="/catalog" class="cta-button">
          Browse Products <span class="arrow">→</span>
        </a>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <h2 class="section-title">Why Choose Us</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🥬</div>
          <h3>Farm Fresh</h3>
          <p>Sourced directly from local farms every morning for maximum freshness.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🚚</div>
          <h3>Fast Delivery</h3>
          <p>Same-day delivery to your doorstep, carefully packed and handled.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">💰</div>
          <h3>Best Prices</h3>
          <p>Direct sourcing means no middlemen — you get the freshest at fair prices.</p>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="how-it-works">
      <h2 class="section-title">How It Works</h2>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>Browse & Select</h3>
            <p>Choose from our wide range of fresh vegetables and fruits.</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>Place Your Order</h3>
            <p>Add items to your cart and check out in seconds.</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>Get It Delivered</h3>
            <p>We deliver fresh to your door the same day.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Bottom CTA -->
    <section class="bottom-cta">
      <div class="cta-card">
        <h2>Ready to eat fresh?</h2>
        <p>Sign up today and get 10% off your first order.</p>
        <a routerLink="/register" class="cta-button">
          Get Started <span class="arrow">→</span>
        </a>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }

    .hero {
      background: linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%);
      padding: 4rem 1.5rem;
      text-align: center;
    }

    .hero-content {
      max-width: 600px;
      margin: 0 auto;
    }

    .hero h1 {
      font-size: 2.25rem;
      font-weight: 800;
      color: #1a1a1a;
      line-height: 1.2;
      margin: 0 0 1rem;
    }

    .hero-subtext {
      font-size: 1.05rem;
      color: #6b7280;
      margin: 0 0 2rem;
      line-height: 1.5;
    }

    .cta-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      max-width: 320px;
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #16a34a, #15803d);
      color: #ffffff;
      font-size: 1.05rem;
      font-weight: 600;
      border-radius: 12px;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
      gap: 0.5rem;
    }

    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(22, 163, 74, 0.3);
    }

    .cta-button .arrow {
      font-size: 1.25rem;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a1a;
      text-align: center;
      margin: 0 0 2rem;
    }

    /* Features */
    .features {
      padding: 3.5rem 1.5rem;
      max-width: 960px;
      margin: 0 auto;
    }

    .features-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.25rem;
    }

    .feature-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 1.75rem;
      text-align: center;
      transition: box-shadow 0.2s;
    }

    .feature-card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    .feature-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #ecfdf5;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin: 0 auto 1rem;
    }

    .feature-card h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0 0 0.5rem;
    }

    .feature-card p {
      font-size: 0.9rem;
      color: #6b7280;
      line-height: 1.5;
      margin: 0;
    }

    /* How It Works */
    .how-it-works {
      padding: 3.5rem 1.5rem;
      background: #f9fafb;
      max-width: 960px;
      margin: 0 auto;
    }

    .steps {
      display: flex;
      flex-direction: column;
      gap: 0;
      position: relative;
      max-width: 480px;
      margin: 0 auto;
    }

    .step {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      position: relative;
      padding-bottom: 2rem;
    }

    .step:not(:last-child)::after {
      content: '';
      position: absolute;
      left: 20px;
      top: 44px;
      width: 2px;
      height: calc(100% - 44px);
      background: #d1fae5;
    }

    .step-number {
      width: 42px;
      height: 42px;
      min-width: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, #16a34a, #15803d);
      color: #ffffff;
      font-size: 1rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 1;
    }

    .step-content h3 {
      font-size: 1.05rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0 0 0.25rem;
    }

    .step-content p {
      font-size: 0.9rem;
      color: #6b7280;
      margin: 0;
      line-height: 1.5;
    }

    /* Bottom CTA */
    .bottom-cta {
      padding: 3rem 1.5rem 4rem;
    }

    .cta-card {
      max-width: 600px;
      margin: 0 auto;
      background: linear-gradient(135deg, #16a34a, #15803d);
      border-radius: 20px;
      padding: 2.5rem 2rem;
      text-align: center;
      color: #ffffff;
    }

    .cta-card h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 0.75rem;
    }

    .cta-card p {
      font-size: 0.95rem;
      opacity: 0.9;
      margin: 0 0 1.5rem;
    }

    .cta-card .cta-button {
      background: #ffffff;
      color: #16a34a;
      max-width: 260px;
    }

    .cta-card .cta-button:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }

    /* Responsive */
    @media (min-width: 640px) {
      .hero h1 {
        font-size: 3rem;
      }

      .features-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  `]
})
export class HomePage {}
