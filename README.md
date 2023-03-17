# Salesforce CRM For Cafe

The project has two parts:
1) Application for Waiter
2) Site for customers

## Application for Waiter

1. A "Waiter Profile" profile has been created for waiters, where permissions are configured for this application to create orders, read products, and run flow (the main work is done with the flow)
2. A waiter user has been created.  The application can be tested by this user
3. Tabs required for the work of a waiter have been added to the application. A lighting page has also been created, which includes the flow for waiters.


### The main parts for waiters are FLOW

1) The first is the welcome screen
2) The second screen  is with details for the order and has fields validations
3) The third screen is the LWC component which is called from  the screen flow
4) If no product is selected, an error screen will appear
5) The order number and total amount are displayed on the final screen
The order is created with the products that were selected in Flow, all the relevant fields are filled. The order is created with Default Account and Default Contact. The layout of the Order has been changed, dividing it into basic information and details. The order is created in "Pending Activated" status.


## Site for Customers

1. A "Community Self-Reg User" profile was created for customers, which was cloned from the standard profile and the required permissions were added (order creation, product type, price book type, and access to the apex controller)
2. Create a site according to the standard SF template. The possibility of self-registration for users is included, then a Contact record is automatically created for all users who register, and this contact is linked to the Default Account
3. A user was also created for testing. Credential are added below.


### Description of the components of the Site

1. Main page "Home" with the name of the cafe and the "Make Order" button.

2. The "Make Order" button redirects to the order creation page, which consists of several LWC components.
![image](https://user-images.githubusercontent.com/48255139/224378975-00d76176-0fec-4d83-bec9-74fd23724646.png)

  2.1. Products on this page are grouped by Categories (required Picklist field on Product).
  
  2.2. There is sorting by Name and Price.
  
  2.3. Product cards display their photos (a file from the Product record, which must be named in a certain way). If there is no photo of the Product, then a standard picture from Static Resource is used for it.
  
  2.4. When clicking on the product card, the card turns over and the Product description is displayed. If there is no description, then nothing happens.
  
  2.5. Each card has a "Buy" button, which, when clicked, adds the Product to the shopping cart.
  
  2.6. The basket consists of two parts: Order detail and the data table of selected products. Here, the customer can edit the cart, the number of products and remove products from the cart.
  
  2.7. The client can turn on Notifications to the Email and to the Notification Center through the Toggle in the Order Detail section (The Email field is filled with the email from the client's account).
![image](https://user-images.githubusercontent.com/48255139/224379230-f0247c53-6ee0-4b65-9e1b-8120aef8ed5d.png)

3. Description of the "My Orders" page
![image](https://user-images.githubusercontent.com/48255139/224380109-2aa71469-9267-4ab4-be3b-53e75492248a.png)

  3.1. This page shows all customer orders.
  3.2. The customer can view the Products in any order by clicking the "Products" button.
  ![image](https://user-images.githubusercontent.com/48255139/224381079-8584e15c-d89f-49ce-9bf6-1ada1eba1fa7.png)
  3.3. With the help of the "Repeat Order" button, the customer can repeat his order with all the products that were ordered before.
  ![image](https://user-images.githubusercontent.com/48255139/224381423-222348bc-a623-455b-89a2-5a9f6fe6ecc1.png)

4. Description of the "About Us" page
![image](https://user-images.githubusercontent.com/48255139/224381979-a421961e-2ff0-4e36-b68a-6eb0b311fa77.png)

  4.1. This page has three tabs: Contacts, Location, Our History.
  
  4.2. Location Tab: This tab is created by VisualForce Page with Google Maps iframe.


## About Development

The code was written in compliance with conventions, accesses, etc. Unit Tests were written for all classes. All text messages from methods/components etc. were taken to Custom Label. Static Resources, Custom Settings, Custom Metadata were also used as necessary.

Another flow was created to send notifications to email and the Notification Center.


## Development plans

I am planning to further develop this project.
The next step is to improve all existing functionality. Also currently being developed for the work of Waiters: a table of reserved tables with the ability to reserve a table, edit an order, create an order on one page.


## *Credentials for the site*

Login: lysyakdima@gmail.com

Password: 1234dima

Link: https://ukrainiancafe-dev-ed.develop.my.site.com/EmptyPlate/s/
