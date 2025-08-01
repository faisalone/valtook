'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingCart, Menu, X, ChevronDown, Store } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/currency';
import { AutoFontText } from '@/components/AutoFontText';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface NavbarProps {}

const Navbar = ({ }: NavbarProps = {}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDepartmentsOpen, setIsDepartmentsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const departmentsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use the global authentication state
  const { isAuthenticated, loading } = useAdminAuth();
  
  // Use cart context
  const { state: cartState } = useCart();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleMobileSearch = () => {
    setIsMobileSearchOpen(!isMobileSearchOpen);
  };

  const handleSellerClick = () => {
    if (loading) return; // Don't redirect while checking auth status
    
    if (isAuthenticated) {
      window.location.href = '/admin';
    } else {
      window.location.href = '/admin/login';
    }
  };

  const handleDepartmentsMouseEnter = () => {
    if (departmentsTimeoutRef.current) {
      clearTimeout(departmentsTimeoutRef.current);
    }
    setIsDepartmentsOpen(true);
  };

  const handleDepartmentsMouseLeave = () => {
    departmentsTimeoutRef.current = setTimeout(() => {
      setIsDepartmentsOpen(false);
    }, 150); // 150ms delay before closing
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
      setIsMobileSearchOpen(false); // Close mobile search after submit
    }
  };

  // Close mobile search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setIsMobileSearchOpen(false);
      }
    };

    if (isMobileSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileSearchOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (departmentsTimeoutRef.current) {
        clearTimeout(departmentsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* Top Header - Modern blue to purple gradient */}
            <div className="text-white theme-gradient-secondary">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-20">
            {/* Desktop Layout */}
            <div className="hidden lg:flex items-center justify-between w-full">
              {/* Left Side - Logo */}
              <div className="flex items-center">
                <Link href="/" className="flex items-center">
                  <Image 
                    src="/logo-light.svg" 
                    alt="HOREKMART" 
                    width={180} 
                    height={60} 
                    className="h-28 w-auto"
                  />
                </Link>
              </div>

              {/* Center - Search Bar */}
              <div className="flex-1 max-w-2xl mx-8">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search everything at Walmart online and in store"
                    className="w-full pl-4 pr-12 py-4 text-black rounded-full border-2 border-gray-300 focus:border-purple-500 focus:outline-none text-base bg-white"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white p-2 rounded-full cursor-pointer theme-button-secondary"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </form>
              </div>

              {/* Right Side - Actions */}
              <div className="flex items-center space-x-6">
                {/* Reorder */}
                <Link 
                  href="/reorder" 
                  className="flex items-center space-x-2 text-white transition-colors hover:opacity-80"
                >
                  <div className="h-6 w-6 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-0.5">
                      <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>
                      <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>
                      <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>
                      <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>
                    </div>
                  </div>
                  <div className="text-base">
                    <div className="text-sm opacity-80">
                      <AutoFontText>Reorder</AutoFontText>
                    </div>
                    <div className="font-medium">
                      <AutoFontText>My Items</AutoFontText>
                    </div>
                  </div>
                </Link>

                {/* Cart */}
                <Link 
                  href="/cart" 
                  className="relative flex items-center space-x-3 text-white transition-colors hover:opacity-80"
                >
                  <div className="relative">
                    <ShoppingCart className="h-8 w-8" />
                    {cartState.totalItems > 0 && (
                      <span 
                        className="absolute -top-3 -right-3 bg-white text-purple-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm"
                      >
                        {cartState.totalItems}
                      </span>
                    )}
                  </div>
                  <div className="text-base">
                    <div className="text-sm opacity-80">
                      <AutoFontText>Cart</AutoFontText>
                    </div>
                    <div className="font-medium">{formatCurrency(cartState.totalPrice)}</div>
                  </div>
                </Link>

                {/* Seller Button */}
                <button 
                  onClick={handleSellerClick}
                  disabled={loading}
                  className={`flex items-center space-x-2 border-2 border-white text-white px-4 py-2.5 rounded-lg font-semibold transition-all duration-300 hover:bg-white hover:text-purple-600 cursor-pointer ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Store className="h-5 w-5" />
                  <span className="text-sm font-bold">
                    <AutoFontText>
                      {loading ? '...' : isAuthenticated ? 'Dashboard' : 'Start Selling'}
                    </AutoFontText>
                  </span>
                </button>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden flex items-center w-full">
              {/* Mobile Search - Left side */}
              <div className="relative mr-4" ref={mobileSearchRef}>
                <form onSubmit={handleSearchSubmit} className="relative">
                  {/* Search input field - expands from left to right */}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className={`absolute left-0 top-1/2 transform -translate-y-1/2 h-12 rounded-full border-2 border-gray-300 bg-white text-black outline-none transition-all duration-300 ease-out ${
                      isMobileSearchOpen 
                        ? 'w-64 pl-14 pr-10 opacity-100 focus:border-theme-teal' 
                        : 'w-12 opacity-0 pointer-events-none'
                    }`}
                    autoFocus={isMobileSearchOpen}
                  />
                  
                  {/* Search icon - fixed position, always visible, matching desktop theme */}
                  <button
                    type={isMobileSearchOpen ? "submit" : "button"}
                    onClick={isMobileSearchOpen ? (searchQuery.trim() ? undefined : toggleMobileSearch) : toggleMobileSearch}
                    className="search-button relative z-10 w-12 h-12 rounded-full text-white flex items-center justify-center cursor-pointer theme-button-secondary"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                  
                  {/* Close button - appears when search is open, positioned within the search field */}
                  {isMobileSearchOpen && (
                    <button
                      type="button"
                      onClick={toggleMobileSearch}
                      className="absolute left-56 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors z-20"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </form>
              </div>

              {/* Logo - Center */}
              <Link href="/" className="flex items-center flex-1 justify-center">
                <Image 
                  src="/logo-light.svg" 
                  alt="HOREKMART" 
                  width={150} 
                  height={50} 
                  className="h-24 w-auto"
                />
              </Link>

              {/* Mobile Right Side Actions */}
              <div className="flex items-center space-x-3">
                {/* Seller Button - Mobile */}
                <button 
                  onClick={handleSellerClick}
                  disabled={loading}
                  className={`flex items-center justify-center border-2 border-white text-white p-2.5 rounded-lg transition-all duration-300 hover:bg-white hover:text-purple-600 cursor-pointer ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title={loading ? 'Loading...' : isAuthenticated ? 'Go to Dashboard' : 'Start Selling'}
                >
                  <Store className="h-5 w-5" />
                </button>

                {/* Cart */}
                <Link 
                  href="/cart" 
                  className="relative flex items-center text-white transition-colors hover:opacity-80"
                >
                  <div className="relative">
                    <ShoppingCart className="h-6 w-6" />
                    {cartState.totalItems > 0 && (
                      <span 
                        className="absolute -top-3 -right-3 bg-white text-purple-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm"
                      >
                        {cartState.totalItems}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Mobile Menu Button */}
                <button
                  onClick={toggleMenu}
                  className="p-2 text-white cursor-pointer transition-colors hover:opacity-80"
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Header - Departments and Menu - Desktop Only */}
      <div className="hidden lg:block text-white theme-gradient-primary">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14">
            {/* Departments Dropdown - Enhanced smooth interaction */}
            <div className="relative hidden lg:block mr-8">
              <button
                onMouseEnter={handleDepartmentsMouseEnter}
                onMouseLeave={handleDepartmentsMouseLeave}
                className="flex items-center space-x-2 text-white px-4 py-2 rounded cursor-pointer transition-colors hover:bg-theme-primary-dark/50"
              >
                <Menu className="h-4 w-4" />
                <span className="text-base font-medium">
                  <AutoFontText>Departments</AutoFontText>
                </span>
                <ChevronDown className="h-3 w-3" />
              </button>
              
              {isDepartmentsOpen && (
                <div
                  onMouseEnter={handleDepartmentsMouseEnter}
                  onMouseLeave={handleDepartmentsMouseLeave}
                  className="absolute top-full left-0 bg-white text-black shadow-lg rounded-md py-2 w-72 z-50 -mt-1"
                  style={{ paddingTop: '8px', marginTop: '-4px' }}
                >
                  <div className="grid grid-cols-1 gap-1 p-3 pt-1">
                    <Link href="/electronics" className="block px-4 py-3 hover:bg-gray-100 text-base rounded transition-colors">
                      <AutoFontText>Electronics</AutoFontText>
                    </Link>
                    <Link href="/clothing" className="block px-4 py-3 hover:bg-gray-100 text-base rounded transition-colors">
                      <AutoFontText>Clothing, Shoes & Accessories</AutoFontText>
                    </Link>
                    <Link href="/home" className="block px-4 py-3 hover:bg-gray-100 text-base rounded transition-colors">
                      <AutoFontText>Home & Garden</AutoFontText>
                    </Link>
                    <Link href="/grocery" className="block px-4 py-3 hover:bg-gray-100 text-base rounded transition-colors">
                      <AutoFontText>Grocery & Essentials</AutoFontText>
                    </Link>
                    <Link href="/sports" className="block px-4 py-3 hover:bg-gray-100 text-base rounded transition-colors">
                      <AutoFontText>Sports & Outdoors</AutoFontText>
                    </Link>
                    <Link href="/auto" className="block px-4 py-3 hover:bg-gray-100 text-base rounded transition-colors">
                      <AutoFontText>Auto & Tires</AutoFontText>
                    </Link>
                    <Link href="/toys" className="block px-4 py-3 hover:bg-gray-100 text-base rounded transition-colors">
                      <AutoFontText>Toys & Games</AutoFontText>
                    </Link>
                    <Link href="/baby" className="block px-4 py-3 hover:bg-gray-100 text-base rounded transition-colors">
                      <AutoFontText>Baby</AutoFontText>
                    </Link>
                    <Link href="/health" className="block px-4 py-3 hover:bg-gray-100 text-base rounded transition-colors">
                      <AutoFontText>Health & Wellness</AutoFontText>
                    </Link>
                    <Link href="/beauty" className="block px-4 py-3 hover:bg-gray-100 text-base rounded transition-colors">
                      <AutoFontText>Beauty & Personal Care</AutoFontText>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Main Navigation Menu */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link href="/grocery" className="text-base text-white hover:opacity-80 transition-colors">
                Grocery & essentials
              </Link>
              <Link href="/valentine" className="text-base text-white hover:opacity-80 transition-colors">
                Valentine&apos;s Day
              </Link>
              <Link href="/fashion" className="text-base text-white hover:opacity-80 transition-colors">
                Fashion
              </Link>
              <Link href="/electronics" className="text-base text-white hover:opacity-80 transition-colors">
                Electronics
              </Link>
              <Link href="/home" className="text-base text-white hover:opacity-80 transition-colors">
                Home
              </Link>
              <Link href="/auto" className="text-base text-white hover:opacity-80 transition-colors">
                Auto
              </Link>
              <Link href="/pharmacy" className="text-base text-white hover:opacity-80 transition-colors">
                Pharmacy
              </Link>
              <Link href="/registry" className="text-base text-white hover:opacity-80 transition-colors">
                Registry
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="px-4 pt-4 pb-4 space-y-4">
            {/* Mobile Navigation Links */}
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 text-gray-900 hover:bg-gray-50 rounded-md font-medium">
                Departments
              </button>
              <Link
                href="/grocery"
                className="block px-4 py-3 text-gray-900 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Grocery & essentials
              </Link>
              <Link
                href="/fashion"
                className="block px-4 py-3 text-gray-900 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Fashion
              </Link>
              <Link
                href="/electronics"
                className="block px-4 py-3 text-gray-900 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Electronics
              </Link>
              <Link
                href="/reorder"
                className="flex items-center px-4 py-3 text-gray-900 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="h-5 w-5 flex items-center justify-center mr-3">
                  <div className="grid grid-cols-2 gap-0.5">
                    <div className="w-1 h-1 bg-gray-900 rounded-sm"></div>
                    <div className="w-1 h-1 bg-gray-900 rounded-sm"></div>
                    <div className="w-1 h-1 bg-gray-900 rounded-sm"></div>
                    <div className="w-1 h-1 bg-gray-900 rounded-sm"></div>
                  </div>
                </div>
                Reorder
              </Link>
              <button
                onClick={() => {
                  handleSellerClick();
                  setIsMenuOpen(false);
                }}
                disabled={loading}
                className={`flex items-center px-4 py-3 border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white rounded-lg font-semibold transition-all duration-300 mx-2 mb-2 cursor-pointer ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Store className="h-5 w-5 mr-3" />
                {loading ? 'Loading...' : isAuthenticated ? 'Go to Dashboard' : 'Start Selling'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
