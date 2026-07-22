# ERP CRM System - Testing Guide

## Quick Start Testing

### 1. Start the Application
```bash
cd /vercel/share/v0-project
pnpm dev
```
Open your browser to `http://localhost:3000`

### 2. Login Instructions
The login page accepts ANY name and email combination. This is for testing purposes.

**Test Credentials (use any of these):**
- Name: Admin User, Email: admin@test.com, Role: Admin
- Name: Sales Rep, Email: sales@test.com, Role: Sales
- Name: Warehouse Manager, Email: warehouse@test.com, Role: Warehouse
- Name: Accountant, Email: accounts@test.com, Role: Accounts

### 3. Navigate the Application

#### Admin Role Testing
1. **Login** as Admin
2. **Dashboard**: View KPIs, charts, and recent activities
3. **Customers Module**:
   - Search for customers by name/email/company
   - Click "New Customer" to add a new customer
   - Click eye icon to view customer details
   - Delete a customer using trash icon
4. **Products Module**:
   - View product cards with stock indicators
   - Notice low-stock alerts (red indicators)
   - Click edit or delete buttons
   - Add new products
5. **Inventory Module**:
   - Check inbound/outbound statistics
   - Filter by type (All, Inbound, Outbound)
   - View stock movement history
   - Add new inventory entries
6. **Sales Challans**:
   - View challan list
   - Search by challan ID
   - View challan details
   - Print or delete challans
7. **Reports**:
   - View sales performance trends
   - Check product distribution pie chart
   - Review recent reports
   - Generate new reports (button available)
8. **Settings**:
   - Navigate through tabs (Profile, Notifications, Security, Appearance)
   - Customize user preferences
   - Change password
   - Select theme

#### Sales Role Testing
1. **Login** as Sales
2. **Dashboard**: View weekly performance and top customers
3. **Customers**: View your customer portfolio
4. **Orders**: Check your sales orders
5. **Reports**: See sales-specific metrics
6. **Settings**: Manage personal preferences
7. **Note**: Navigation sidebar shows only Sales-relevant modules

#### Warehouse Role Testing
1. **Login** as Warehouse
2. **Dashboard**: Monitor stock levels and critical alerts
3. **Inventory**: Track stock by category
4. **Stock Movements**: View inbound/outbound activity
5. **Alerts Section**: See critical and warning level items
6. **Note**: Warehouse-specific dashboard and modules

#### Accounts Role Testing
1. **Login** as Accounts
2. **Dashboard**: Monitor financial metrics
3. **Invoices**: View invoice management
4. **Transactions**: Check transaction history
5. **Reports**: View financial charts
6. **Note**: Finance-focused dashboard

## Feature Testing Checklist

### Authentication Flow
- [ ] Login page displays correctly
- [ ] All 4 role cards are clickable and show selection state
- [ ] Form validation works (shows errors for invalid input)
- [ ] Login redirects to correct role dashboard
- [ ] Logout button works and returns to login
- [ ] Session persists after page refresh

### Navigation
- [ ] Sidebar displays correct menu items per role
- [ ] Active menu item is highlighted
- [ ] Clicking menu items navigates to correct page
- [ ] Breadcrumb navigation works
- [ ] Back navigation works

### Dashboards
- [ ] Admin dashboard shows all KPI cards
- [ ] Charts render without errors
- [ ] Sales dashboard shows weekly performance
- [ ] Warehouse dashboard shows stock status
- [ ] Accounts dashboard shows financial metrics

### Customer Management (Admin)
- [ ] Customer table displays all customers
- [ ] Search filters work correctly
- [ ] New Customer button opens modal
- [ ] Edit button shows customer details
- [ ] Delete button removes customer from list
- [ ] Modal closes properly

### Product Management (Admin)
- [ ] Product cards display with images and info
- [ ] Stock level indicators show correctly (green/red)
- [ ] Low stock alert badge displays
- [ ] Product actions (edit/delete) work
- [ ] Grid layout is responsive

### Inventory Management (Admin)
- [ ] Inventory stats cards update correctly
- [ ] Filter buttons work (All/Inbound/Outbound)
- [ ] Search filters inventory entries
- [ ] Table shows all columns properly
- [ ] New Entry button opens modal
- [ ] Delete removes entries

### Reports
- [ ] Charts render with data
- [ ] Charts are responsive
- [ ] Reports list shows entries
- [ ] Download button is available

### Responsive Design
- [ ] Desktop view (1920px): All content visible
- [ ] Tablet view (768px): Layout adjusts properly
- [ ] Mobile view (375px): Menu collapses, content stacks
- [ ] Navigation works on all sizes
- [ ] Tables scroll horizontally on small screens

### Animations & Interactions
- [ ] Page transitions are smooth
- [ ] Button hover effects work
- [ ] Modal appears with animation
- [ ] List items fade in smoothly
- [ ] Charts animate on load

### Dark Mode
- [ ] Light mode displays correctly
- [ ] Dark mode displays correctly
- [ ] System preference is respected
- [ ] Colors maintain proper contrast
- [ ] All text remains readable

### Accessibility
- [ ] Keyboard navigation works (Tab key)
- [ ] Form inputs are focusable
- [ ] Buttons have focus indicators
- [ ] Icons have alt text/aria labels
- [ ] Color contrast is adequate

## Testing Scenarios

### Scenario 1: Admin User Full Journey
1. Login as Admin
2. View dashboard metrics
3. Add new customer
4. Add new product
5. Check inventory
6. View reports
7. Logout

**Expected Result**: All features work smoothly with proper navigation

### Scenario 2: Sales User Workflow
1. Login as Sales
2. View dashboard
3. Check customers
4. Check orders
5. View sales reports
6. Update settings
7. Logout

**Expected Result**: Sales-specific features work correctly

### Scenario 3: Warehouse User Tasks
1. Login as Warehouse
2. Monitor stock levels
3. Check critical alerts
4. View stock movements
5. Check warehouse reports
6. Logout

**Expected Result**: Warehouse operations function correctly

### Scenario 4: Accounts User Operations
1. Login as Accounts
2. Review financial dashboard
3. Check invoices
4. View transactions
5. Generate reports
6. Logout

**Expected Result**: Financial functions work as expected

### Scenario 5: Cross-Device Testing
1. Login on desktop (1920x1080)
2. Test all features on desktop
3. Login on tablet (768x1024)
4. Test responsive layout
5. Login on mobile (375x667)
6. Test mobile navigation
7. Verify responsive design

**Expected Result**: Application works on all screen sizes

## Performance Testing

### Load Time
- [ ] Initial page load < 3 seconds
- [ ] Dashboard loads smoothly
- [ ] Navigation transitions < 500ms
- [ ] Modal opens instantly

### Charts & Analytics
- [ ] Charts render within 1 second
- [ ] Large datasets don't cause lag
- [ ] Animations run at 60fps
- [ ] Scrolling is smooth

### Search & Filter
- [ ] Search results appear instantly
- [ ] Filter actions are responsive
- [ ] Sorting works quickly
- [ ] No blocking operations

## Error Handling

Test the following error scenarios:
- [ ] Invalid form input shows validation errors
- [ ] Attempting unauthorized access redirects
- [ ] Network errors gracefully handled (if API connected)
- [ ] Malformed data displays appropriately

## Browser Compatibility

Test on:
- [ ] Chrome/Edge (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

## Known Limitations & Notes

1. **Data Persistence**: Data resets on page refresh (localStorage used for demo)
2. **Filters**: Some filter combinations may need refinement
3. **Charts**: Data is mocked for demo purposes
4. **Modals**: Currently text-based (can be enhanced with full forms)

## Success Criteria

✅ All role dashboards load correctly
✅ Navigation works between pages
✅ Search and filter features work
✅ Modal dialogs open and close properly
✅ Forms validate input
✅ Animations are smooth
✅ Responsive design works on mobile/tablet/desktop
✅ Dark mode functions correctly
✅ No console errors
✅ Page load time is acceptable

## Reporting Issues

When testing, note:
1. **Browser**: Chrome, Firefox, Safari, etc.
2. **Screen Size**: Mobile, Tablet, Desktop
3. **Steps to Reproduce**: Exactly how to trigger the issue
4. **Expected Result**: What should happen
5. **Actual Result**: What actually happened
6. **Screenshots**: Include if possible

## Future Testing Considerations

Once integrated with a database:
- [ ] Test with real data
- [ ] Load testing with large datasets
- [ ] Concurrent user testing
- [ ] Data consistency checks
- [ ] Backup and recovery
- [ ] Security testing

## Quick Test Checklist

```
Role-Based Access:  [ ]
Admin Dashboard:    [ ]
Sales Dashboard:    [ ]
Warehouse Dashboard:[ ]
Accounts Dashboard: [ ]
Customer CRUD:      [ ]
Product Management: [ ]
Inventory Tracking: [ ]
Charts/Reports:     [ ]
Mobile Responsive:  [ ]
Dark Mode:          [ ]
Animations:         [ ]
Search/Filter:      [ ]
Modal Dialogs:      [ ]
Form Validation:    [ ]
Logout:             [ ]
```

## Tips for Effective Testing

1. **Clear Browser Cache**: Use DevTools to clear cache between tests
2. **Try Different Roles**: Each role has different features
3. **Test Edge Cases**: Try empty searches, large data sets, etc.
4. **Use DevTools**: Check for console errors and performance metrics
5. **Test on Multiple Browsers**: Ensure cross-browser compatibility
6. **Test on Multiple Devices**: Check responsive design
7. **Test Dark Mode**: Toggle system preference in browser
8. **Verify Keyboard Navigation**: Tab through the application

Enjoy testing the ERP CRM System!
