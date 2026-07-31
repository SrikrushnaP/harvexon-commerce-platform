/**
 * HCP Comprehensive Seed Script
 * Populates the database with realistic data for all modules.
 * Run: npx tsx src/scripts/seed.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Models
import { User } from '../modules/auth/user.model';
import { Unit } from '../modules/catalog/unit.model';
import { Category } from '../modules/catalog/category.model';
import { Product } from '../modules/catalog/product.model';
import { CustomerGroup } from '../modules/customer/customer-group.model';
import { Customer } from '../modules/customer/customer.model';
import { Address } from '../modules/customer/address.model';
import { Supplier } from '../modules/purchasing/supplier.model';
import { Order } from '../modules/order/order.model';
import { DeliveryStaff } from '../modules/delivery/delivery-staff.model';
import { DeliveryAssignment } from '../modules/delivery/delivery-assignment.model';
import { InventoryTransaction } from '../modules/inventory/inventory-transaction.model';
import { Settings } from '../modules/settings/settings.model';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function generatePhone(): string {
  return `+91${randomBetween(70000, 99999)}${randomBetween(10000, 99999)}`;
}

// ─── Seed Units ──────────────────────────────────────────────────────────────

async function seedUnits() {
  const units = [
    { name: 'Kilogram', shortName: 'kg' },
    { name: 'Gram', shortName: 'g' },
    { name: 'Piece', shortName: 'pc' },
    { name: 'Bunch', shortName: 'bunch' },
    { name: 'Litre', shortName: 'L' },
    { name: 'Dozen', shortName: 'dz' },
    { name: 'Packet', shortName: 'pkt' },
    { name: 'Box', shortName: 'box' },
  ];

  const created = await Unit.insertMany(units);
  console.log(`  ✅ ${created.length} units created`);
  return created;
}

// ─── Seed Categories ─────────────────────────────────────────────────────────

async function seedCategories() {
  const categories = [
    { name: 'Leafy Greens', slug: 'leafy-greens', description: 'Fresh green leafy vegetables', sortOrder: 1 },
    { name: 'Root Vegetables', slug: 'root-vegetables', description: 'Underground growing vegetables', sortOrder: 2 },
    { name: 'Gourds & Squash', slug: 'gourds-squash', description: 'Bottle gourd, pumpkin, and more', sortOrder: 3 },
    { name: 'Exotic Vegetables', slug: 'exotic-vegetables', description: 'Imported and specialty vegetables', sortOrder: 4 },
    { name: 'Herbs & Aromatics', slug: 'herbs-aromatics', description: 'Fresh cooking herbs', sortOrder: 5 },
    { name: 'Fruits', slug: 'fruits', description: 'Seasonal and everyday fruits', sortOrder: 6 },
    { name: 'Dairy & Eggs', slug: 'dairy-eggs', description: 'Farm-fresh dairy products', sortOrder: 7 },
    { name: 'Organic', slug: 'organic', description: 'Certified organic produce', sortOrder: 8 },
  ];

  const created = await Category.insertMany(categories);
  console.log(`  ✅ ${created.length} categories created`);
  return created;
}

// ─── Seed Customer Groups ────────────────────────────────────────────────────

async function seedCustomerGroups() {
  const groups = [
    {
      name: 'Retail Customers',
      type: 'retail',
      description: 'Individual household buyers',
      discountPercent: 0,
      minOrderAmount: 200,
      creditLimit: 0,
      creditPeriodDays: 0,
      paymentTerms: 'Payment on delivery',
    },
    {
      name: 'Wholesale Buyers',
      type: 'wholesale',
      description: 'Bulk purchase partners with credit facility',
      discountPercent: 10,
      minOrderAmount: 2000,
      creditLimit: 50000,
      creditPeriodDays: 15,
      paymentTerms: 'Net 15 days from delivery',
    },
    {
      name: 'Restaurant Partners',
      type: 'restaurant',
      description: 'Hotels, restaurants, and catering businesses',
      discountPercent: 8,
      minOrderAmount: 1500,
      creditLimit: 30000,
      creditPeriodDays: 7,
      paymentTerms: 'Weekly settlement every Monday',
    },
    {
      name: 'VIP Members',
      type: 'vip',
      description: 'Premium loyalty members with exclusive benefits',
      discountPercent: 5,
      minOrderAmount: 100,
      creditLimit: 10000,
      creditPeriodDays: 30,
      paymentTerms: 'Monthly billing',
    },
    {
      name: 'Distributors',
      type: 'distributor',
      description: 'Regional distribution partners',
      discountPercent: 15,
      minOrderAmount: 5000,
      creditLimit: 100000,
      creditPeriodDays: 30,
      paymentTerms: 'Net 30 days, 2% early payment discount',
    },
  ];

  const created = await CustomerGroup.insertMany(groups);
  console.log(`  ✅ ${created.length} customer groups created`);
  return created;
}

// ─── Seed Users ──────────────────────────────────────────────────────────────

async function seedUsers() {
  const users = [
    // Admin
    {
      name: 'Rajesh Kumar',
      email: 'admin@hrfressh.com',
      phone: '+919876543210',
      password: 'admin123',
      role: 'admin',
      lastLogin: daysAgo(0),
    },
    // Manager
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@hrfressh.com',
      phone: '+919876543211',
      password: 'manager123',
      role: 'manager',
      lastLogin: daysAgo(1),
    },
    // Staff
    {
      name: 'Vikram Singh',
      email: 'vikram@hrfressh.com',
      phone: '+919876543212',
      password: 'staff123',
      role: 'staff',
      lastLogin: daysAgo(0),
    },
    {
      name: 'Anita Patel',
      email: 'anita@hrfressh.com',
      phone: '+919876543213',
      password: 'staff123',
      role: 'staff',
      lastLogin: daysAgo(2),
    },
    // Delivery
    {
      name: 'Mohammed Rafi',
      email: 'rafi@hrfressh.com',
      phone: '+919876543220',
      password: 'delivery123',
      role: 'delivery',
      lastLogin: daysAgo(0),
    },
    {
      name: 'Suresh Yadav',
      email: 'suresh.y@hrfressh.com',
      phone: '+919876543221',
      password: 'delivery123',
      role: 'delivery',
      lastLogin: daysAgo(0),
    },
    {
      name: 'Karthik Nair',
      email: 'karthik@hrfressh.com',
      phone: '+919876543222',
      password: 'delivery123',
      role: 'delivery',
      lastLogin: daysAgo(1),
    },
    {
      name: 'Deepak Joshi',
      email: 'deepak.j@hrfressh.com',
      phone: '+919876543223',
      password: 'delivery123',
      role: 'delivery',
      lastLogin: daysAgo(3),
    },
    // Customer users
    {
      name: 'Meena Reddy',
      email: 'meena.r@gmail.com',
      phone: '+919812345001',
      password: 'customer123',
      role: 'customer',
      lastLogin: daysAgo(0),
    },
    {
      name: 'Arjun Kapoor',
      email: 'arjun.k@gmail.com',
      phone: '+919812345002',
      password: 'customer123',
      role: 'customer',
      lastLogin: daysAgo(1),
    },
    {
      name: 'Sunita Devi',
      email: 'sunita.d@yahoo.com',
      phone: '+919812345003',
      password: 'customer123',
      role: 'customer',
      lastLogin: daysAgo(2),
    },
    {
      name: 'Rohit Mehta',
      email: 'rohit.m@outlook.com',
      phone: '+919812345004',
      password: 'customer123',
      role: 'customer',
      lastLogin: daysAgo(0),
    },
    {
      name: 'Lakshmi Iyer',
      email: 'lakshmi.i@gmail.com',
      phone: '+919812345005',
      password: 'customer123',
      role: 'customer',
      lastLogin: daysAgo(4),
    },
    {
      name: 'Amit Gupta',
      email: 'amit.g@hotmail.com',
      phone: '+919812345006',
      password: 'customer123',
      role: 'customer',
      lastLogin: daysAgo(1),
    },
  ];

  // Use save() for each to trigger pre-save bcrypt hook
  const created = [];
  for (const userData of users) {
    const user = new User(userData);
    await user.save();
    created.push(user);
  }
  console.log(`  ✅ ${created.length} users created (passwords hashed with bcrypt)`);
  return created;
}

// ─── Seed Products ───────────────────────────────────────────────────────────

async function seedProducts(categories: any[], units: any[]) {
  const kg = units.find((u: any) => u.shortName === 'kg')!._id;
  const g = units.find((u: any) => u.shortName === 'g')!._id;
  const pc = units.find((u: any) => u.shortName === 'pc')!._id;
  const bunch = units.find((u: any) => u.shortName === 'bunch')!._id;
  const L = units.find((u: any) => u.shortName === 'L')!._id;
  const dz = units.find((u: any) => u.shortName === 'dz')!._id;
  const pkt = units.find((u: any) => u.shortName === 'pkt')!._id;

  const catMap: Record<string, any> = {};
  categories.forEach((c: any) => { catMap[c.slug] = c._id; });

  const products = [
    // Leafy Greens
    { name: 'Fresh Spinach', slug: 'fresh-spinach', sku: 'VEG-LG-001', description: 'Farm-fresh baby spinach leaves, washed and ready to cook', category: catMap['leafy-greens'], unit: bunch, basePrice: 30, isFeatured: true, tags: ['popular', 'iron-rich'], lowStockThreshold: 20 },
    { name: 'Methi (Fenugreek)', slug: 'methi-fenugreek', sku: 'VEG-LG-002', description: 'Aromatic fenugreek leaves, perfect for parathas and sabzi', category: catMap['leafy-greens'], unit: bunch, basePrice: 25, tags: ['seasonal'], lowStockThreshold: 15 },
    { name: 'Coriander Leaves', slug: 'coriander-leaves', sku: 'VEG-LG-003', description: 'Fresh coriander with strong aroma for garnishing', category: catMap['leafy-greens'], unit: bunch, basePrice: 15, isFeatured: true, tags: ['essential', 'garnish'], lowStockThreshold: 30 },
    { name: 'Mint Leaves', slug: 'mint-leaves', sku: 'VEG-LG-004', description: 'Fresh pudina leaves for chutneys and drinks', category: catMap['leafy-greens'], unit: bunch, basePrice: 20, tags: ['chutney', 'drinks'], lowStockThreshold: 20 },
    { name: 'Amaranth (Lal Saag)', slug: 'amaranth-lal-saag', sku: 'VEG-LG-005', description: 'Red amaranth leaves rich in nutrients', category: catMap['leafy-greens'], unit: bunch, basePrice: 35, tags: ['nutritious'], lowStockThreshold: 10 },

    // Root Vegetables
    { name: 'Potato (Aloo)', slug: 'potato-aloo', sku: 'VEG-RT-001', description: 'Premium quality potatoes for all cooking needs', category: catMap['root-vegetables'], unit: kg, basePrice: 40, isFeatured: true, tags: ['staple', 'popular'], lowStockThreshold: 100 },
    { name: 'Onion (Pyaaz)', slug: 'onion-pyaaz', sku: 'VEG-RT-002', description: 'Fresh red onions, medium size', category: catMap['root-vegetables'], unit: kg, basePrice: 35, isFeatured: true, tags: ['staple', 'essential'], lowStockThreshold: 100 },
    { name: 'Carrot (Gajar)', slug: 'carrot-gajar', sku: 'VEG-RT-003', description: 'Crunchy orange carrots, great for salads and cooking', category: catMap['root-vegetables'], unit: kg, basePrice: 60, tags: ['salad', 'juice'], lowStockThreshold: 40 },
    { name: 'Beetroot', slug: 'beetroot', sku: 'VEG-RT-004', description: 'Deep red beetroots, perfect for juices and salads', category: catMap['root-vegetables'], unit: kg, basePrice: 50, tags: ['juice', 'healthy'], lowStockThreshold: 30 },
    { name: 'Radish (Mooli)', slug: 'radish-mooli', sku: 'VEG-RT-005', description: 'Long white radishes, crisp and fresh', category: catMap['root-vegetables'], unit: kg, basePrice: 30, tags: ['seasonal', 'salad'], lowStockThreshold: 25 },
    { name: 'Ginger (Adrak)', slug: 'ginger-adrak', sku: 'VEG-RT-006', description: 'Fresh ginger root with strong flavor', category: catMap['root-vegetables'], unit: g, basePrice: 180, tags: ['spice', 'essential'], lowStockThreshold: 20 },
    { name: 'Garlic (Lehsun)', slug: 'garlic-lehsun', sku: 'VEG-RT-007', description: 'Whole garlic bulbs, pungent and fresh', category: catMap['root-vegetables'], unit: g, basePrice: 200, tags: ['spice', 'essential'], lowStockThreshold: 20 },

    // Gourds & Squash
    { name: 'Bottle Gourd (Lauki)', slug: 'bottle-gourd-lauki', sku: 'VEG-GD-001', description: 'Light green bottle gourd, tender and fresh', category: catMap['gourds-squash'], unit: pc, basePrice: 35, tags: ['light', 'diet'], lowStockThreshold: 20 },
    { name: 'Bitter Gourd (Karela)', slug: 'bitter-gourd-karela', sku: 'VEG-GD-002', description: 'Fresh bitter gourd, small variety', category: catMap['gourds-squash'], unit: kg, basePrice: 80, tags: ['diabetic-friendly'], lowStockThreshold: 15 },
    { name: 'Ridge Gourd (Tori)', slug: 'ridge-gourd-tori', sku: 'VEG-GD-003', description: 'Tender ridge gourd, great for quick stir-fry', category: catMap['gourds-squash'], unit: kg, basePrice: 50, tags: ['light'], lowStockThreshold: 15 },
    { name: 'Pumpkin (Kaddu)', slug: 'pumpkin-kaddu', sku: 'VEG-GD-004', description: 'Orange pumpkin, sweet and nutritious', category: catMap['gourds-squash'], unit: kg, basePrice: 30, tags: ['sweet', 'seasonal'], lowStockThreshold: 20 },

    // Exotic Vegetables
    { name: 'Broccoli', slug: 'broccoli', sku: 'VEG-EX-001', description: 'Fresh broccoli florets, imported quality', category: catMap['exotic-vegetables'], unit: pc, basePrice: 90, isFeatured: true, tags: ['healthy', 'protein', 'discount:15'], lowStockThreshold: 15 },
    { name: 'Zucchini', slug: 'zucchini', sku: 'VEG-EX-002', description: 'Green zucchini, perfect for grilling and pasta', category: catMap['exotic-vegetables'], unit: kg, basePrice: 120, tags: ['diet', 'western'], lowStockThreshold: 10 },
    { name: 'Bell Pepper (Shimla Mirch)', slug: 'bell-pepper', sku: 'VEG-EX-003', description: 'Mixed colored bell peppers - red, yellow, green', category: catMap['exotic-vegetables'], unit: kg, basePrice: 150, isFeatured: true, tags: ['colorful', 'salad', 'discount:12'], lowStockThreshold: 15 },
    { name: 'Mushroom (Button)', slug: 'mushroom-button', sku: 'VEG-EX-004', description: 'Fresh button mushrooms, 200g pack', category: catMap['exotic-vegetables'], unit: pkt, basePrice: 60, tags: ['protein', 'stir-fry'], lowStockThreshold: 20 },
    { name: 'Baby Corn', slug: 'baby-corn', sku: 'VEG-EX-005', description: 'Tender baby corn sticks, great for Chinese cooking', category: catMap['exotic-vegetables'], unit: pkt, basePrice: 55, tags: ['chinese', 'stir-fry'], lowStockThreshold: 15 },

    // Herbs & Aromatics
    { name: 'Curry Leaves', slug: 'curry-leaves', sku: 'VEG-HB-001', description: 'Fresh curry leaves bunch, aromatic', category: catMap['herbs-aromatics'], unit: bunch, basePrice: 10, tags: ['south-indian', 'tempering'], lowStockThreshold: 30 },
    { name: 'Green Chilli', slug: 'green-chilli', sku: 'VEG-HB-002', description: 'Fresh green chillies, medium spice', category: catMap['herbs-aromatics'], unit: g, basePrice: 80, tags: ['spicy', 'essential'], lowStockThreshold: 20 },
    { name: 'Lemongrass', slug: 'lemongrass', sku: 'VEG-HB-003', description: 'Fresh lemongrass stalks for tea and cooking', category: catMap['herbs-aromatics'], unit: bunch, basePrice: 30, tags: ['tea', 'thai'], lowStockThreshold: 10 },

    // Fruits
    { name: 'Banana (Kela)', slug: 'banana-kela', sku: 'FRT-001', description: 'Ripe yellow bananas, Robusta variety', category: catMap['fruits'], unit: dz, basePrice: 50, isFeatured: true, tags: ['everyday', 'energy'], lowStockThreshold: 50 },
    { name: 'Apple (Shimla)', slug: 'apple-shimla', sku: 'FRT-002', description: 'Red delicious apples from Himachal', category: catMap['fruits'], unit: kg, basePrice: 180, tags: ['premium', 'healthy', 'discount:10'], lowStockThreshold: 30 },
    { name: 'Papaya', slug: 'papaya', sku: 'FRT-003', description: 'Ripe papaya, sweet and nutritious', category: catMap['fruits'], unit: pc, basePrice: 60, tags: ['digestive', 'tropical'], lowStockThreshold: 20 },
    { name: 'Pomegranate (Anar)', slug: 'pomegranate-anar', sku: 'FRT-004', description: 'Juicy red pomegranates, seedless variety', category: catMap['fruits'], unit: kg, basePrice: 220, tags: ['premium', 'juice', 'discount:20'], lowStockThreshold: 15 },

    // Dairy & Eggs
    { name: 'Farm Fresh Eggs', slug: 'farm-fresh-eggs', sku: 'DRY-001', description: 'Free-range eggs, pack of 6', category: catMap['dairy-eggs'], unit: pkt, basePrice: 60, isFeatured: true, tags: ['protein', 'breakfast'], lowStockThreshold: 40 },
    { name: 'Fresh Paneer', slug: 'fresh-paneer', sku: 'DRY-002', description: 'Handmade cottage cheese, 200g block', category: catMap['dairy-eggs'], unit: pkt, basePrice: 90, tags: ['protein', 'vegetarian'], lowStockThreshold: 20 },
    { name: 'Curd (Dahi)', slug: 'curd-dahi', sku: 'DRY-003', description: 'Fresh homemade curd, 500ml', category: catMap['dairy-eggs'], unit: L, basePrice: 50, tags: ['probiotic', 'daily'], lowStockThreshold: 25 },

    // Organic
    { name: 'Organic Tomato', slug: 'organic-tomato', sku: 'ORG-001', description: 'Certified organic vine tomatoes', category: catMap['organic'], unit: kg, basePrice: 80, isFeatured: true, tags: ['organic', 'certified'], lowStockThreshold: 20 },
    { name: 'Organic Cucumber', slug: 'organic-cucumber', sku: 'ORG-002', description: 'Pesticide-free fresh cucumbers', category: catMap['organic'], unit: kg, basePrice: 60, tags: ['organic', 'salad'], lowStockThreshold: 15 },
    { name: 'Organic Spinach', slug: 'organic-spinach', sku: 'ORG-003', description: 'Chemical-free spinach from organic farms', category: catMap['organic'], unit: bunch, basePrice: 50, tags: ['organic', 'iron-rich'], lowStockThreshold: 15 },
  ];

  // Add default fields
  const imageMap: Record<string, string> = {
    'fresh-spinach': '/images/products/spinach.jpg',
    'methi-fenugreek': '/images/products/methi.jpg',
    'coriander-leaves': '/images/products/coriander.jpg',
    'mint-leaves': '/images/products/mint.jpg',
    'amaranth-lal-saag': '/images/products/amaranth.jpg',
    'potato-aloo': '/images/products/potato.jpg',
    'onion-pyaaz': '/images/products/onion.jpg',
    'carrot-gajar': '/images/products/carrot.jpg',
    'beetroot': '/images/products/beetroot.jpg',
    'radish-mooli': '/images/products/radish.jpg',
    'ginger-adrak': '/images/products/ginger.jpg',
    'garlic-lehsun': '/images/products/garlic.jpg',
    'bottle-gourd-lauki': '/images/products/bottle-gourd.jpg',
    'bitter-gourd-karela': '/images/products/bitter-gourd.jpg',
    'ridge-gourd-tori': '/images/products/ridge-gourd.jpg',
    'pumpkin-kaddu': '/images/products/pumpkin.jpg',
    'broccoli': '/images/products/broccoli.jpg',
    'zucchini': '/images/products/zucchini.jpg',
    'bell-pepper': '/images/products/bell-pepper.jpg',
    'mushroom-button': '/images/products/mushroom.jpg',
    'baby-corn': '/images/products/baby-corn.jpg',
    'curry-leaves': '/images/products/curry-leaves.jpg',
    'green-chilli': '/images/products/green-chilli.jpg',
    'lemongrass': '/images/products/lemongrass.jpg',
    'banana-kela': '/images/products/banana.jpg',
    'apple-shimla': '/images/products/apple.jpg',
    'papaya': '/images/products/papaya.jpg',
    'pomegranate-anar': '/images/products/pomegranate.jpg',
    'farm-fresh-eggs': '/images/products/eggs.jpg',
    'fresh-paneer': '/images/products/paneer.jpg',
    'curd-dahi': '/images/products/curd.jpg',
    'organic-tomato': '/images/products/tomato.jpg',
    'organic-cucumber': '/images/products/cucumber.jpg',
    'organic-spinach': '/images/products/spinach.jpg',
  };

  const productsWithDefaults = products.map(p => ({
    ...p,
    images: imageMap[p.slug] ? [imageMap[p.slug]] : [],
    isAvailable: true,
    trackInventory: true,
    sortOrder: 0,
  }));

  const created = await Product.insertMany(productsWithDefaults);
  console.log(`  ✅ ${created.length} products created`);
  return created;
}

// ─── Seed Suppliers ──────────────────────────────────────────────────────────

async function seedSuppliers() {
  const suppliers = [
    {
      name: 'Kisaan Fresh Farms',
      contactPerson: 'Ramesh Patel',
      phone: '+919800100001',
      email: 'ramesh@kisaanfresh.com',
      address: { line1: 'Village Mahudi', line2: 'Near Canal Road', city: 'Mehsana', state: 'Gujarat', pincode: '384001' },
      gstin: '24AABCK1234M1ZV',
      paymentTerms: 'Net 7 days',
      tags: ['vegetables', 'leafy', 'bulk'],
      totalPurchases: 45,
      totalSpent: 325000,
    },
    {
      name: 'Green Valley Organics',
      contactPerson: 'Seema Deshpande',
      phone: '+919800100002',
      email: 'info@greenvalley.in',
      address: { line1: '234 Industrial Area', city: 'Nashik', state: 'Maharashtra', pincode: '422001' },
      gstin: '27AABCG5678N1ZP',
      paymentTerms: 'Net 15 days',
      tags: ['organic', 'certified', 'premium'],
      totalPurchases: 22,
      totalSpent: 180000,
    },
    {
      name: 'Himalayan Fruits Co.',
      contactPerson: 'Tenzin Dorji',
      phone: '+919800100003',
      email: 'supply@himfruit.com',
      address: { line1: 'Mall Road', city: 'Shimla', state: 'Himachal Pradesh', pincode: '171001' },
      paymentTerms: 'Advance payment',
      tags: ['fruits', 'apples', 'seasonal'],
      totalPurchases: 18,
      totalSpent: 420000,
    },
    {
      name: 'Dairy Direct Suppliers',
      contactPerson: 'Govind Rao',
      phone: '+919800100004',
      email: 'govind@dairydirect.in',
      address: { line1: '56 Milk Colony', city: 'Anand', state: 'Gujarat', pincode: '388001' },
      gstin: '24AABCD9012P1ZK',
      paymentTerms: 'Cash on delivery',
      tags: ['dairy', 'eggs', 'daily'],
      totalPurchases: 120,
      totalSpent: 560000,
    },
    {
      name: 'South Spice Garden',
      contactPerson: 'Kavitha Menon',
      phone: '+919800100005',
      email: 'kavitha@southspice.com',
      address: { line1: 'Plantation Road', line2: 'Wayanad District', city: 'Kalpetta', state: 'Kerala', pincode: '673121' },
      paymentTerms: 'Net 10 days',
      tags: ['herbs', 'spices', 'exotic'],
      totalPurchases: 30,
      totalSpent: 95000,
    },
    {
      name: 'Metro Agri Wholesale',
      contactPerson: 'Anil Agarwal',
      phone: '+919800100006',
      email: 'anil@metroagri.com',
      address: { line1: 'APMC Market Yard', line2: 'Gate 3, Shop 45', city: 'Mumbai', state: 'Maharashtra', pincode: '400088' },
      gstin: '27AABCM3456Q1ZR',
      paymentTerms: 'Net 15 days, 1% early discount',
      bankDetails: { accountName: 'Metro Agri Wholesale Pvt Ltd', bankName: 'HDFC Bank', accountNumber: '50100234567890', ifsc: 'HDFC0001234' },
      tags: ['wholesale', 'bulk', 'root-vegetables'],
      totalPurchases: 85,
      totalSpent: 890000,
    },
  ];

  const created = await Supplier.insertMany(suppliers);
  console.log(`  ✅ ${created.length} suppliers created`);
  return created;
}

// ─── Seed Customers ──────────────────────────────────────────────────────────

async function seedCustomers(groups: any[]) {
  const retailGroup = groups.find((g: any) => g.type === 'retail')!._id;
  const wholesaleGroup = groups.find((g: any) => g.type === 'wholesale')!._id;
  const restaurantGroup = groups.find((g: any) => g.type === 'restaurant')!._id;
  const vipGroup = groups.find((g: any) => g.type === 'vip')!._id;

  const customers = [
    { name: 'Meena Reddy', phone: '+919812345001', email: 'meena.r@gmail.com', group: retailGroup, tags: ['regular'], totalOrders: 12, totalSpent: 4500, lastOrderDate: daysAgo(2) },
    { name: 'Arjun Kapoor', phone: '+919812345002', email: 'arjun.k@gmail.com', group: vipGroup, tags: ['vip', 'loyal'], totalOrders: 45, totalSpent: 28000, lastOrderDate: daysAgo(1) },
    { name: 'Sunita Devi', phone: '+919812345003', email: 'sunita.d@yahoo.com', group: retailGroup, tags: ['new'], totalOrders: 3, totalSpent: 850, lastOrderDate: daysAgo(5) },
    { name: 'Rohit Mehta', phone: '+919812345004', email: 'rohit.m@outlook.com', group: retailGroup, tags: ['regular'], totalOrders: 8, totalSpent: 3200, lastOrderDate: daysAgo(0) },
    { name: 'Lakshmi Iyer', phone: '+919812345005', email: 'lakshmi.i@gmail.com', group: vipGroup, tags: ['vip', 'organic-lover'], totalOrders: 32, totalSpent: 18500, lastOrderDate: daysAgo(3) },
    { name: 'Amit Gupta', phone: '+919812345006', email: 'amit.g@hotmail.com', group: retailGroup, tags: ['occasional'], totalOrders: 5, totalSpent: 1800, lastOrderDate: daysAgo(7) },
    { name: 'Taj Kitchen Restaurant', phone: '+919800200001', email: 'orders@tajkitchen.in', group: restaurantGroup, businessName: 'Taj Kitchen Pvt Ltd', gstin: '27AABCT7890K1ZH', tags: ['restaurant', 'daily-order'], totalOrders: 180, totalSpent: 450000, lastOrderDate: daysAgo(0) },
    { name: 'Fresh Bites Cafe', phone: '+919800200002', email: 'freshbites@gmail.com', group: restaurantGroup, businessName: 'Fresh Bites Food Services', tags: ['cafe', 'regular'], totalOrders: 95, totalSpent: 185000, lastOrderDate: daysAgo(1) },
    { name: 'Singh Wholesale Mart', phone: '+919800200003', email: 'singhmart@yahoo.com', group: wholesaleGroup, businessName: 'Singh & Sons Trading Co.', gstin: '24AABCS1234N1ZL', tags: ['wholesale', 'bulk'], totalOrders: 60, totalSpent: 520000, lastOrderDate: daysAgo(2) },
    { name: 'Krishna Vegetables', phone: '+919800200004', email: 'krishnaveg@gmail.com', group: wholesaleGroup, businessName: 'Krishna Vegetable Traders', gstin: '27AABCK5678P1ZM', tags: ['wholesale', 'reseller'], totalOrders: 40, totalSpent: 380000, lastOrderDate: daysAgo(3) },
    { name: 'Pooja Nair', phone: '+919812345007', email: 'pooja.n@gmail.com', group: retailGroup, tags: ['regular', 'weekend'], totalOrders: 15, totalSpent: 5200, lastOrderDate: daysAgo(4) },
    { name: 'Sanjay Dubey', phone: '+919812345008', email: 'sanjay.d@outlook.com', group: retailGroup, tags: ['new'], totalOrders: 2, totalSpent: 650, lastOrderDate: daysAgo(10) },
  ];

  const created = await Customer.insertMany(customers);
  console.log(`  ✅ ${created.length} customers created`);
  return created;
}

// ─── Seed Addresses ──────────────────────────────────────────────────────────

async function seedAddresses(customers: any[]) {
  const addresses = [
    { customer: customers[0]._id, label: 'Home', line1: '42, Lakshmi Nagar', line2: 'Near Shiv Temple', city: 'Hyderabad', state: 'Telangana', pincode: '500032', landmark: 'Opposite SBI Bank', isDefault: true },
    { customer: customers[0]._id, label: 'Office', line1: 'Floor 3, Hitech City', line2: 'Madhapur', city: 'Hyderabad', state: 'Telangana', pincode: '500081', isDefault: false },
    { customer: customers[1]._id, label: 'Home', line1: '15, Palm Residency', line2: 'Sector 22', city: 'Gurgaon', state: 'Haryana', pincode: '122015', landmark: 'Near Huda Metro', isDefault: true },
    { customer: customers[2]._id, label: 'Home', line1: '8/2 Gandhi Road', city: 'Pune', state: 'Maharashtra', pincode: '411001', isDefault: true },
    { customer: customers[3]._id, label: 'Home', line1: '201 Sagar Apartments', line2: 'Andheri West', city: 'Mumbai', state: 'Maharashtra', pincode: '400058', landmark: 'Near Metro Station', isDefault: true },
    { customer: customers[4]._id, label: 'Home', line1: '33 Temple Street', line2: 'Mylapore', city: 'Chennai', state: 'Tamil Nadu', pincode: '600004', isDefault: true },
    { customer: customers[5]._id, label: 'Home', line1: '67 Civil Lines', city: 'Jaipur', state: 'Rajasthan', pincode: '302006', isDefault: true },
    { customer: customers[6]._id, label: 'Restaurant', line1: '12 Commercial Complex', line2: 'MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001', landmark: 'Next to ICICI Bank', isDefault: true },
    { customer: customers[7]._id, label: 'Cafe', line1: '5 Food Street', line2: 'Koramangala', city: 'Bangalore', state: 'Karnataka', pincode: '560034', isDefault: true },
    { customer: customers[8]._id, label: 'Warehouse', line1: 'Plot 89, GIDC', line2: 'Phase 2', city: 'Ahmedabad', state: 'Gujarat', pincode: '382445', isDefault: true },
    { customer: customers[9]._id, label: 'Shop', line1: 'Shop 23, APMC Market', city: 'Navi Mumbai', state: 'Maharashtra', pincode: '400705', isDefault: true },
    { customer: customers[10]._id, label: 'Home', line1: '18 Sea View Road', line2: 'Versova', city: 'Mumbai', state: 'Maharashtra', pincode: '400061', isDefault: true },
    { customer: customers[11]._id, label: 'Home', line1: '99 Nehru Nagar', city: 'Bhopal', state: 'Madhya Pradesh', pincode: '462003', isDefault: true },
  ];

  const created = await Address.insertMany(addresses);
  console.log(`  ✅ ${created.length} addresses created`);
  return created;
}

// ─── Seed Delivery Staff ─────────────────────────────────────────────────────

async function seedDeliveryStaff(users: any[]) {
  const deliveryUsers = users.filter((u: any) => u.role === 'delivery');

  const staff = [
    {
      user: deliveryUsers[0]?._id,
      name: 'Mohammed Rafi',
      phone: '+919876543220',
      email: 'rafi@hrfressh.com',
      vehicleType: 'Motorcycle',
      vehicleNumber: 'MH-02-AB-1234',
      isAvailable: true,
      completedDeliveries: 342,
      rating: 4.8,
      joinedAt: daysAgo(180),
      currentLocation: { lat: 19.0760, lng: 72.8777, updatedAt: new Date() },
    },
    {
      user: deliveryUsers[1]?._id,
      name: 'Suresh Yadav',
      phone: '+919876543221',
      email: 'suresh.y@hrfressh.com',
      vehicleType: 'Electric Scooter',
      vehicleNumber: 'MH-02-CD-5678',
      isAvailable: true,
      completedDeliveries: 218,
      rating: 4.6,
      joinedAt: daysAgo(120),
      currentLocation: { lat: 19.0830, lng: 72.8900, updatedAt: new Date() },
    },
    {
      user: deliveryUsers[2]?._id,
      name: 'Karthik Nair',
      phone: '+919876543222',
      email: 'karthik@hrfressh.com',
      vehicleType: 'Motorcycle',
      vehicleNumber: 'MH-02-EF-9012',
      isAvailable: false,
      completedDeliveries: 156,
      rating: 4.5,
      joinedAt: daysAgo(90),
      notes: 'On leave till Monday',
    },
    {
      user: deliveryUsers[3]?._id,
      name: 'Deepak Joshi',
      phone: '+919876543223',
      email: 'deepak.j@hrfressh.com',
      vehicleType: 'Bicycle',
      vehicleNumber: '',
      isAvailable: true,
      completedDeliveries: 89,
      rating: 4.3,
      joinedAt: daysAgo(45),
      currentLocation: { lat: 19.0650, lng: 72.8650, updatedAt: new Date() },
      notes: 'Covers 5km radius only',
    },
    {
      name: 'Prakash Thakur',
      phone: '+919876543224',
      email: 'prakash.t@hrfressh.com',
      vehicleType: 'Tempo (3-wheeler)',
      vehicleNumber: 'MH-02-GH-3456',
      isAvailable: true,
      completedDeliveries: 412,
      rating: 4.9,
      joinedAt: daysAgo(365),
      currentLocation: { lat: 19.0550, lng: 72.8400, updatedAt: new Date() },
      notes: 'Handles bulk/wholesale deliveries',
    },
    {
      name: 'Raju Sharma',
      phone: '+919876543225',
      email: 'raju.s@hrfressh.com',
      vehicleType: 'Electric Scooter',
      vehicleNumber: 'MH-02-IJ-7890',
      isAvailable: true,
      completedDeliveries: 67,
      rating: 4.4,
      joinedAt: daysAgo(30),
    },
  ];

  const created = await DeliveryStaff.insertMany(staff);
  console.log(`  ✅ ${created.length} delivery staff created`);
  return created;
}

// ─── Seed Orders ─────────────────────────────────────────────────────────────

async function seedOrders(customers: any[], products: any[], users: any[], deliveryStaff: any[], addresses: any[]) {
  const adminUser = users.find((u: any) => u.role === 'admin')!._id;

  // Helper to create order items from products
  function makeItems(productIndices: number[], quantities: number[]) {
    return productIndices.map((idx, i) => {
      const p = products[idx];
      const qty = quantities[i];
      return {
        product: p._id,
        name: p.name,
        unit: 'kg',
        quantity: qty,
        price: p.basePrice,
        total: p.basePrice * qty,
      };
    });
  }

  const orders = [
    // Order 1 - Delivered 2 days ago
    {
      orderNumber: 'ORD-2026-0001',
      customer: customers[0]._id,
      deliveryAddress: { label: 'Home', line1: '42, Lakshmi Nagar', line2: 'Near Shiv Temple', city: 'Hyderabad', state: 'Telangana', pincode: '500032' },
      items: makeItems([5, 6, 2, 22], [2, 1, 2, 1]),
      status: 'delivered',
      subtotal: 0, deliveryCharge: 30, discount: 0, total: 0,
      paymentMethod: 'upi' as const, paymentStatus: 'paid' as const, paidAmount: 0,
      orderDate: daysAgo(3),
      confirmedAt: daysAgo(3),
      packedAt: daysAgo(2),
      deliveredAt: daysAgo(2),
      statusHistory: [
        { status: 'draft', timestamp: daysAgo(3) },
        { status: 'confirmed', timestamp: daysAgo(3), changedBy: adminUser },
        { status: 'processing', timestamp: daysAgo(3), changedBy: adminUser },
        { status: 'packed', timestamp: daysAgo(2), changedBy: adminUser },
        { status: 'assigned', timestamp: daysAgo(2), changedBy: adminUser },
        { status: 'out_for_delivery', timestamp: daysAgo(2), changedBy: adminUser },
        { status: 'delivered', timestamp: daysAgo(2), changedBy: adminUser },
      ],
    },
    // Order 2 - Delivered yesterday
    {
      orderNumber: 'ORD-2026-0002',
      customer: customers[1]._id,
      deliveryAddress: { label: 'Home', line1: '15, Palm Residency', line2: 'Sector 22', city: 'Gurgaon', state: 'Haryana', pincode: '122015' },
      items: makeItems([16, 18, 19, 29, 30], [1, 2, 1, 1, 2]),
      status: 'delivered',
      subtotal: 0, deliveryCharge: 0, discount: 50, total: 0,
      paymentMethod: 'upi' as const, paymentStatus: 'paid' as const, paidAmount: 0,
      orderDate: daysAgo(2),
      confirmedAt: daysAgo(2),
      packedAt: daysAgo(1),
      deliveredAt: daysAgo(1),
      statusHistory: [
        { status: 'draft', timestamp: daysAgo(2) },
        { status: 'confirmed', timestamp: daysAgo(2), changedBy: adminUser },
        { status: 'packed', timestamp: daysAgo(1), changedBy: adminUser },
        { status: 'delivered', timestamp: daysAgo(1), changedBy: adminUser },
      ],
    },
    // Order 3 - Out for delivery
    {
      orderNumber: 'ORD-2026-0003',
      customer: customers[3]._id,
      deliveryAddress: { label: 'Home', line1: '201 Sagar Apartments', line2: 'Andheri West', city: 'Mumbai', state: 'Maharashtra', pincode: '400058' },
      items: makeItems([0, 5, 7, 11, 23], [3, 5, 2, 1, 2]),
      status: 'out_for_delivery',
      subtotal: 0, deliveryCharge: 40, discount: 0, total: 0,
      paymentMethod: 'cash' as const, paymentStatus: 'pending' as const, paidAmount: 0,
      orderDate: daysAgo(1),
      confirmedAt: daysAgo(1),
      packedAt: daysAgo(0),
      statusHistory: [
        { status: 'draft', timestamp: daysAgo(1) },
        { status: 'confirmed', timestamp: daysAgo(1), changedBy: adminUser },
        { status: 'processing', timestamp: daysAgo(1), changedBy: adminUser },
        { status: 'packed', timestamp: daysAgo(0), changedBy: adminUser },
        { status: 'assigned', timestamp: daysAgo(0), changedBy: adminUser },
        { status: 'out_for_delivery', timestamp: daysAgo(0), changedBy: adminUser },
      ],
    },
    // Order 4 - Packed (ready for delivery)
    {
      orderNumber: 'ORD-2026-0004',
      customer: customers[6]._id,
      deliveryAddress: { label: 'Restaurant', line1: '12 Commercial Complex', line2: 'MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
      items: makeItems([5, 6, 7, 0, 2, 10, 11, 16, 22], [10, 8, 5, 5, 5, 2, 1, 3, 3]),
      status: 'packed',
      subtotal: 0, deliveryCharge: 0, discount: 200, total: 0,
      paymentMethod: 'bank_transfer' as const, paymentStatus: 'pending' as const, paidAmount: 0,
      orderDate: daysAgo(0),
      confirmedAt: daysAgo(0),
      packedAt: daysAgo(0),
      statusHistory: [
        { status: 'draft', timestamp: daysAgo(0) },
        { status: 'confirmed', timestamp: daysAgo(0), changedBy: adminUser },
        { status: 'processing', timestamp: daysAgo(0), changedBy: adminUser },
        { status: 'packed', timestamp: daysAgo(0), changedBy: adminUser },
      ],
    },
    // Order 5 - Confirmed (being processed)
    {
      orderNumber: 'ORD-2026-0005',
      customer: customers[4]._id,
      deliveryAddress: { label: 'Home', line1: '33 Temple Street', line2: 'Mylapore', city: 'Chennai', state: 'Tamil Nadu', pincode: '600004' },
      items: makeItems([31, 32, 33, 24, 25], [2, 1, 3, 1, 2]),
      status: 'confirmed',
      subtotal: 0, deliveryCharge: 50, discount: 30, total: 0,
      paymentMethod: 'upi' as const, paymentStatus: 'paid' as const, paidAmount: 0,
      orderDate: daysAgo(0),
      confirmedAt: daysAgo(0),
      statusHistory: [
        { status: 'draft', timestamp: daysAgo(0) },
        { status: 'confirmed', timestamp: daysAgo(0), changedBy: adminUser },
      ],
    },
    // Order 6 - Draft (new)
    {
      orderNumber: 'ORD-2026-0006',
      customer: customers[10]._id,
      deliveryAddress: { label: 'Home', line1: '18 Sea View Road', line2: 'Versova', city: 'Mumbai', state: 'Maharashtra', pincode: '400061' },
      items: makeItems([0, 3, 5, 24, 28], [2, 1, 3, 1, 2]),
      status: 'draft',
      subtotal: 0, deliveryCharge: 30, discount: 0, total: 0,
      paymentMethod: 'cash' as const, paymentStatus: 'pending' as const, paidAmount: 0,
      orderDate: daysAgo(0),
      statusHistory: [
        { status: 'draft', timestamp: daysAgo(0) },
      ],
    },
    // Order 7 - Cancelled
    {
      orderNumber: 'ORD-2026-0007',
      customer: customers[5]._id,
      deliveryAddress: { label: 'Home', line1: '67 Civil Lines', city: 'Jaipur', state: 'Rajasthan', pincode: '302006' },
      items: makeItems([16, 17], [2, 1]),
      status: 'cancelled',
      subtotal: 0, deliveryCharge: 50, discount: 0, total: 0,
      paymentMethod: 'upi' as const, paymentStatus: 'pending' as const, paidAmount: 0,
      orderDate: daysAgo(5),
      cancelledAt: daysAgo(4),
      cancellationReason: 'Customer requested cancellation - changed plans',
      statusHistory: [
        { status: 'draft', timestamp: daysAgo(5) },
        { status: 'confirmed', timestamp: daysAgo(5), changedBy: adminUser },
        { status: 'cancelled', timestamp: daysAgo(4), changedBy: adminUser, notes: 'Customer requested cancellation' },
      ],
    },
    // Order 8 - Delivered (wholesale)
    {
      orderNumber: 'ORD-2026-0008',
      customer: customers[8]._id,
      deliveryAddress: { label: 'Warehouse', line1: 'Plot 89, GIDC', line2: 'Phase 2', city: 'Ahmedabad', state: 'Gujarat', pincode: '382445' },
      items: makeItems([5, 6, 7, 8, 10, 12, 14], [50, 30, 20, 15, 10, 20, 15]),
      status: 'delivered',
      subtotal: 0, deliveryCharge: 0, discount: 500, total: 0,
      paymentMethod: 'bank_transfer' as const, paymentStatus: 'paid' as const, paidAmount: 0,
      orderDate: daysAgo(7),
      confirmedAt: daysAgo(7),
      packedAt: daysAgo(6),
      deliveredAt: daysAgo(6),
      statusHistory: [
        { status: 'draft', timestamp: daysAgo(7) },
        { status: 'confirmed', timestamp: daysAgo(7), changedBy: adminUser },
        { status: 'packed', timestamp: daysAgo(6), changedBy: adminUser },
        { status: 'delivered', timestamp: daysAgo(6), changedBy: adminUser },
      ],
    },
    // Order 9 - Processing
    {
      orderNumber: 'ORD-2026-0009',
      customer: customers[7]._id,
      deliveryAddress: { label: 'Cafe', line1: '5 Food Street', line2: 'Koramangala', city: 'Bangalore', state: 'Karnataka', pincode: '560034' },
      items: makeItems([0, 2, 3, 5, 7, 16, 19, 21, 22], [3, 2, 2, 5, 3, 2, 2, 1, 2]),
      status: 'processing',
      subtotal: 0, deliveryCharge: 0, discount: 100, total: 0,
      paymentMethod: 'credit' as const, paymentStatus: 'pending' as const, paidAmount: 0,
      orderDate: daysAgo(0),
      confirmedAt: daysAgo(0),
      statusHistory: [
        { status: 'draft', timestamp: daysAgo(0) },
        { status: 'confirmed', timestamp: daysAgo(0), changedBy: adminUser },
        { status: 'processing', timestamp: daysAgo(0), changedBy: adminUser },
      ],
    },
    // Order 10 - Delivered (recent)
    {
      orderNumber: 'ORD-2026-0010',
      customer: customers[2]._id,
      deliveryAddress: { label: 'Home', line1: '8/2 Gandhi Road', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
      items: makeItems([24, 25, 28, 30], [2, 1, 1, 1]),
      status: 'delivered',
      subtotal: 0, deliveryCharge: 30, discount: 0, total: 0,
      paymentMethod: 'cash' as const, paymentStatus: 'paid' as const, paidAmount: 0,
      orderDate: daysAgo(4),
      confirmedAt: daysAgo(4),
      packedAt: daysAgo(3),
      deliveredAt: daysAgo(3),
      statusHistory: [
        { status: 'draft', timestamp: daysAgo(4) },
        { status: 'confirmed', timestamp: daysAgo(4), changedBy: adminUser },
        { status: 'packed', timestamp: daysAgo(3), changedBy: adminUser },
        { status: 'delivered', timestamp: daysAgo(3), changedBy: adminUser },
      ],
    },
    // Order 11 - Assigned
    {
      orderNumber: 'ORD-2026-0011',
      customer: customers[9]._id,
      deliveryAddress: { label: 'Shop', line1: 'Shop 23, APMC Market', city: 'Navi Mumbai', state: 'Maharashtra', pincode: '400705' },
      items: makeItems([5, 6, 7, 10, 12, 16], [20, 15, 10, 5, 10, 5]),
      status: 'assigned',
      subtotal: 0, deliveryCharge: 0, discount: 150, total: 0,
      paymentMethod: 'bank_transfer' as const, paymentStatus: 'pending' as const, paidAmount: 0,
      orderDate: daysAgo(0),
      confirmedAt: daysAgo(0),
      packedAt: daysAgo(0),
      statusHistory: [
        { status: 'draft', timestamp: daysAgo(0) },
        { status: 'confirmed', timestamp: daysAgo(0), changedBy: adminUser },
        { status: 'packed', timestamp: daysAgo(0), changedBy: adminUser },
        { status: 'assigned', timestamp: daysAgo(0), changedBy: adminUser },
      ],
    },
    // Order 12 - Delivered last week
    {
      orderNumber: 'ORD-2026-0012',
      customer: customers[1]._id,
      deliveryAddress: { label: 'Home', line1: '15, Palm Residency', line2: 'Sector 22', city: 'Gurgaon', state: 'Haryana', pincode: '122015' },
      items: makeItems([0, 5, 7, 16, 24, 29, 30], [2, 3, 1, 2, 1, 1, 2]),
      status: 'delivered',
      subtotal: 0, deliveryCharge: 0, discount: 40, total: 0,
      paymentMethod: 'upi' as const, paymentStatus: 'paid' as const, paidAmount: 0,
      orderDate: daysAgo(8),
      confirmedAt: daysAgo(8),
      packedAt: daysAgo(7),
      deliveredAt: daysAgo(7),
      statusHistory: [
        { status: 'draft', timestamp: daysAgo(8) },
        { status: 'confirmed', timestamp: daysAgo(8), changedBy: adminUser },
        { status: 'packed', timestamp: daysAgo(7), changedBy: adminUser },
        { status: 'delivered', timestamp: daysAgo(7), changedBy: adminUser },
      ],
    },
  ];

  // Calculate subtotals and totals
  for (const order of orders) {
    order.subtotal = order.items.reduce((sum, item) => sum + item.total, 0);
    order.total = order.subtotal + order.deliveryCharge - order.discount;
    if (order.paymentStatus === 'paid') {
      order.paidAmount = order.total;
    }
  }

  const created = await Order.insertMany(orders);
  console.log(`  ✅ ${created.length} orders created`);

  // Create delivery assignments for assigned/out_for_delivery/delivered orders
  const assignments = [
    { order: created[0]._id, deliveryStaff: deliveryStaff[0]._id, status: 'delivered', assignedAt: daysAgo(2), pickedUpAt: daysAgo(2), deliveredAt: daysAgo(2), customerRating: 5, distance: 4.2, estimatedTime: 25 },
    { order: created[1]._id, deliveryStaff: deliveryStaff[1]._id, status: 'delivered', assignedAt: daysAgo(1), pickedUpAt: daysAgo(1), deliveredAt: daysAgo(1), customerRating: 4, distance: 6.1, estimatedTime: 35 },
    { order: created[2]._id, deliveryStaff: deliveryStaff[0]._id, status: 'in_transit', assignedAt: daysAgo(0), pickedUpAt: daysAgo(0), distance: 3.5, estimatedTime: 20 },
    { order: created[7]._id, deliveryStaff: deliveryStaff[4]._id, status: 'delivered', assignedAt: daysAgo(6), pickedUpAt: daysAgo(6), deliveredAt: daysAgo(6), customerRating: 5, distance: 12, estimatedTime: 45 },
    { order: created[10]._id, deliveryStaff: deliveryStaff[1]._id, status: 'assigned', assignedAt: daysAgo(0), distance: 8.3, estimatedTime: 40 },
    { order: created[11]._id, deliveryStaff: deliveryStaff[3]._id, status: 'delivered', assignedAt: daysAgo(7), pickedUpAt: daysAgo(7), deliveredAt: daysAgo(7), customerRating: 4, distance: 3.8, estimatedTime: 18 },
  ];

  const createdAssignments = await DeliveryAssignment.insertMany(assignments);
  console.log(`  ✅ ${createdAssignments.length} delivery assignments created`);

  return created;
}

// ─── Seed Inventory Transactions ─────────────────────────────────────────────

async function seedInventoryTransactions(products: any[]) {
  const transactions: any[] = [];

  // Initial stock purchase for all products (happened 30 days ago)
  products.forEach((p: any, idx: number) => {
    const qty = randomBetween(50, 200);
    transactions.push({
      product: p._id,
      type: 'purchase',
      quantity: qty,
      direction: 'in',
      referenceType: 'purchase',
      batchNumber: `BATCH-${String(idx + 1).padStart(3, '0')}-A`,
      unitCost: p.basePrice * 0.6,
      notes: 'Initial stock purchase',
      transactionDate: daysAgo(30),
    });
  });

  // Recent purchases (restock) for popular items
  const popularIndices = [0, 2, 5, 6, 7, 16, 22, 24, 28, 29];
  popularIndices.forEach((idx) => {
    const p = products[idx];
    transactions.push({
      product: p._id,
      type: 'purchase',
      quantity: randomBetween(30, 100),
      direction: 'in',
      referenceType: 'purchase',
      batchNumber: `BATCH-${String(idx + 1).padStart(3, '0')}-B`,
      unitCost: p.basePrice * 0.65,
      notes: 'Restock - weekly purchase',
      transactionDate: daysAgo(7),
    });
  });

  // Sales (out) for delivered orders
  const soldItems = [
    { idx: 5, qty: 60, days: 7 },
    { idx: 6, qty: 24, days: 6 },
    { idx: 7, qty: 18, days: 5 },
    { idx: 0, qty: 10, days: 4 },
    { idx: 2, qty: 9, days: 3 },
    { idx: 16, qty: 8, days: 2 },
    { idx: 24, qty: 5, days: 1 },
    { idx: 22, qty: 6, days: 1 },
    { idx: 10, qty: 4, days: 1 },
  ];
  soldItems.forEach(({ idx, qty, days }) => {
    transactions.push({
      product: products[idx]._id,
      type: 'sale',
      quantity: qty,
      direction: 'out',
      referenceType: 'order',
      notes: 'Order fulfillment',
      transactionDate: daysAgo(days),
    });
  });

  // Damage write-offs
  transactions.push({
    product: products[0]._id,
    type: 'damage',
    quantity: 5,
    direction: 'out',
    notes: 'Wilted during storage - hot weather',
    transactionDate: daysAgo(3),
  });
  transactions.push({
    product: products[24]._id,
    type: 'damage',
    quantity: 12,
    direction: 'out',
    notes: 'Overripe - could not sell in time',
    transactionDate: daysAgo(2),
  });

  // Adjustments
  transactions.push({
    product: products[11]._id,
    type: 'adjustment',
    quantity: 2,
    direction: 'in',
    notes: 'Stock count correction - found extra in cold storage',
    transactionDate: daysAgo(1),
  });

  const created = await InventoryTransaction.insertMany(transactions);
  console.log(`  ✅ ${created.length} inventory transactions created`);
  return created;
}

// ─── Seed Settings ───────────────────────────────────────────────────────────

async function seedSettings() {
  const settings = await Settings.create({
    businessName: 'HR Fresh',
    tagline: 'Farm Fresh, Daily Delivered',
    contact: {
      phone: '+919876543210',
      email: 'orders@hrfresh.com',
      address: '123, Vegetable Market, Sector 15',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122001',
      country: 'India',
    },
    currency: 'INR',
    currencySymbol: '₹',
    timezone: 'Asia/Kolkata',
    language: 'en',
    invoicePrefix: 'HRF',
    invoiceStartNumber: 1001,
    gstNumber: '06AABCH1234M1ZV',
    theme: {
      primaryColor: '#16a34a',
      accentColor: '#4ade80',
    },
    businessHours: {
      openTime: '06:00',
      closeTime: '21:00',
      workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    orderSettings: {
      minOrderAmount: 99,
      deliveryCharge: 30,
      freeDeliveryAbove: 499,
      acceptOrders: true,
      orderCutoffTime: '20:00',
      deliveryMessage: 'Same-day delivery • Order before 8 PM',
    },
    notifications: {
      smsEnabled: true,
      whatsappEnabled: true,
      emailEnabled: false,
    },
  });
  console.log(`  ✅ Business settings created (${settings.businessName})`);
}

// ─── Main Seed Function ──────────────────────────────────────────────────────

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hcp_dev';

  console.log('\n🌱 HCP Database Seed Script');
  console.log('═══════════════════════════════════════════\n');
  console.log(`📡 Connecting to: ${MONGODB_URI}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully\n');

    // Drop existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Unit.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      CustomerGroup.deleteMany({}),
      Customer.deleteMany({}),
      Address.deleteMany({}),
      Supplier.deleteMany({}),
      Order.deleteMany({}),
      DeliveryStaff.deleteMany({}),
      DeliveryAssignment.deleteMany({}),
      InventoryTransaction.deleteMany({}),
      Settings.deleteMany({}),
    ]);
    console.log('  ✅ All collections cleared\n');

    // Seed in order (dependencies)
    console.log('📦 Seeding data...\n');

    const units = await seedUnits();
    const categories = await seedCategories();
    const groups = await seedCustomerGroups();
    const users = await seedUsers();
    const products = await seedProducts(categories, units);
    const suppliers = await seedSuppliers();
    const customers = await seedCustomers(groups);
    const addresses = await seedAddresses(customers);
    const deliveryStaff = await seedDeliveryStaff(users);
    const orders = await seedOrders(customers, products, users, deliveryStaff, addresses);
    await seedInventoryTransactions(products);
    await seedSettings();

    console.log('\n═══════════════════════════════════════════');
    console.log('🎉 Seed complete! Summary:');
    console.log('───────────────────────────────────────────');
    console.log(`  👤 Users:          ${users.length}`);
    console.log(`  📏 Units:          ${units.length}`);
    console.log(`  📂 Categories:     ${categories.length}`);
    console.log(`  📦 Products:       ${products.length}`);
    console.log(`  👥 Customer Groups: ${groups.length}`);
    console.log(`  🧑 Customers:      ${customers.length}`);
    console.log(`  📍 Addresses:      ${addresses.length}`);
    console.log(`  🏪 Suppliers:      ${suppliers.length}`);
    console.log(`  🛒 Orders:         ${orders.length}`);
    console.log(`  🚚 Delivery Staff: ${deliveryStaff.length}`);
    console.log('───────────────────────────────────────────');
    console.log('\n🔑 Login Credentials:');
    console.log('  Admin:    admin@hrfressh.com / admin123');
    console.log('  Manager:  priya.sharma@hrfressh.com / manager123');
    console.log('  Staff:    vikram@hrfressh.com / staff123');
    console.log('  Delivery: rafi@hrfressh.com / delivery123');
    console.log('  Customer: meena.r@gmail.com / customer123');
    console.log('═══════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

main();
