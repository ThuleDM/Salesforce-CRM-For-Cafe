@IsTest
private class OrderFormControllerTest {
    @TestSetup static void createProduct() {
        List<Product2> products = new List<Product2>();
        for (Integer i = 1; i < 81; i++) {
            products.add(new Product2(Name = 'Product ' + i,
                    Category__c = i < 10
                            ? 'Drink'
                            : i < 20
                                    ? 'Soup'
                                    : i < 30
                                            ? 'Croissant'
                                            : i < 40
                                                    ? 'Breakfast'
                                                    : i < 50
                                                            ? 'Pizza'
                                                            :
                                                            i < 60
                                                                    ? 'Cupcakes'
                                                                    : i < 70
                                                                    ? 'Pasta' : 'Coffee'));
        }

        insert products;

        Pricebook2 standardPricebook = new Pricebook2(
                Id = Test.getStandardPricebookId(),
                IsActive = true
        );
        update standardPricebook;

        standardPricebook = [SELECT Id, IsStandard FROM Pricebook2 WHERE Id = :standardPricebook.Id FOR UPDATE];

        System.debug(standardPricebook.Id);
        List<PricebookEntry> pricebookEntries = new List<PricebookEntry>();
        Integer i = 2;
        for (Integer j = 0; j < products.size(); ++j) {
            if (j > 75) {
                break;
            }
            PricebookEntry pbe = new PricebookEntry(
                    Pricebook2Id = standardPricebook.Id,
                    Product2Id = products[j].Id,
                    UnitPrice = 10 + i,
                    IsActive = true
            );
            i = i + 2;
            pricebookEntries.add(pbe);
        }
        insert pricebookEntries;
    }

    @IsTest static void testGetProductsByGroups() {
        Test.startTest();
        Map<String, List<ProductWrapper>> productsMap = OrderFormController.getProductsByGroups();
        Test.stopTest();

        Integer totalSizeOfProductsWithSize = 0;
        for (String category : productsMap.keySet()) {
            totalSizeOfProductsWithSize += productsMap.get(category).size();
        }

        System.assertEquals(8, productsMap.size(), '8 categories should be returned');
        System.assertEquals(false, productsMap.containsKey(OrderFormController.OTHER), 'category fields are required');
        System.assertEquals(76, totalSizeOfProductsWithSize, '76 products must have a price');
    }

    @IsTest static void testGetMapProductsWrappers() {
        Test.startTest();
        Map<Id, ProductWrapper> productWrapperMap = OrderFormController.getMapProductsWrappers(Test.getStandardPricebookId());
        Test.stopTest();

        System.assertEquals(80, [SELECT Id FROM Product2].size(), 'In total, 80 products were created');
        System.assertEquals(76, productWrapperMap.size(), 'Only 76 products have a price, 76 wrappers must be created');
    }

    @IsTest static void testGetOrdersListUserWaiter() {
        createOrdersWithUsersWaiterCustomer();
        User waiterUser = [SELECT Id FROM User WHERE Name = 'Waiter' LIMIT 1];
        System.runAs(waiterUser) {
            Test.startTest();
            List<Order> orders = OrderFormController.getOrdersList();
            Test.stopTest();

            System.assertEquals(10, orders.size());
        }
    }

    @IsTest static void testGetOrdersListUserCustomer() {
        createOrdersWithUsersWaiterCustomer();
        User customerUser = [SELECT Id FROM User WHERE Name = 'Customer' LIMIT 1];
        System.runAs(customerUser) {
            Test.startTest();
            List<Order> orders = OrderFormController.getOrdersList();
            Test.stopTest();

            System.assertEquals(5, orders.size());
        }
    }

    @IsTest static void testGetProductsWrapperFromExistOrderByErrorId() {
        createOrdersWithUsersWaiterCustomer();
        User customerUser = [SELECT Id FROM User WHERE Name = 'Customer' LIMIT 1];
        Id waitersOrderId = [SELECT Id FROM Order WHERE OwnerId != :customerUser.Id LIMIT 1].Id;
        PricebookEntry pricebookEntry = [SELECT Id, Product2Id FROM PricebookEntry LIMIT 1];
        insert new OrderItem(OrderId = waitersOrderId, Product2Id = pricebookEntry.Product2Id, PricebookEntryId = pricebookEntry.Id, UnitPrice = 10, Quantity = 10);


        System.runAs(customerUser) {
            Test.startTest();
            List<ProductWrapper> productWrappers = OrderFormController.getProductsWrapperFromExistOrder(waitersOrderId);
            Test.stopTest();

            System.assertEquals(0, productWrappers.size());
        }
    }

    @IsTest static void testGetProductsWrapperFromExistOrderByCorrectId() {
        createOrdersWithUsersWaiterCustomer();
        User customerUser = [SELECT Id FROM User WHERE Name = 'Customer' LIMIT 1];
        Id customersOrderId = [SELECT Id FROM Order WHERE OwnerId = :customerUser.Id LIMIT 1].Id;
        PricebookEntry pricebookEntry = [SELECT Id, UnitPrice, Product2Id FROM PricebookEntry LIMIT 1];
        insert new OrderItem(OrderId = customersOrderId, Product2Id = pricebookEntry.Product2Id,
                PricebookEntryId = pricebookEntry.Id, UnitPrice = pricebookEntry.UnitPrice, Quantity = 10);

        System.runAs(customerUser) {
            Test.startTest();
            List<ProductWrapper> productWrappers = OrderFormController.getProductsWrapperFromExistOrder(customersOrderId);
            Test.stopTest();

            System.assertEquals(1, productWrappers.size());
            System.assertEquals(pricebookEntry.UnitPrice * 10, productWrappers.get(0).totalPrice);
            System.assertEquals(10, productWrappers.get(0).quantity);
        }
    }

    @IsTest static void testGetCurrentUserInfoByCustomerUser() {
        createOrdersWithUsersWaiterCustomer();
        User customerUser = [SELECT Id, ContactId FROM User WHERE Name = 'Customer' LIMIT 1];

        System.runAs(customerUser) {
            Test.startTest();
            Contact contact = OrderFormController.gerCurrentUserInfo();
            Test.stopTest();

            System.assertEquals(customerUser.ContactId, contact.Id);
        }
    }

    @IsTest static void testGetCurrentUserInfoByWaiterUser() {
        createOrdersWithUsersWaiterCustomer();
        User waiterUser = [SELECT Id, ContactId FROM User WHERE Name = 'Waiter' LIMIT 1];

        System.runAs(waiterUser) {
            Test.startTest();
            Contact contact = OrderFormController.gerCurrentUserInfo();
            Test.stopTest();

            System.assertEquals(OrderFormController.DEFAULT_CONTACT, contact.Name);
        }
    }

    @IsTest static void testGetCurrentUserInfoWithoutContactInSystem() {
        Profile waiterProfile = [SELECT Id FROM Profile WHERE Name = 'Waiter Profile'];
        User userWaiter = new User(Alias = 'standt', Email = 'userwaiter@testorg.com',
                EmailEncodingKey = 'UTF-8', LastName = 'Waiter', LanguageLocaleKey = 'en_US',
                LocaleSidKey = 'en_US', ProfileId = waiterProfile.Id,
                TimeZoneSidKey = 'America/Los_Angeles', Username = 'userwaiter@testorg.com');

        System.runAs(userWaiter) {
            Test.startTest();
            Contact contact = OrderFormController.gerCurrentUserInfo();
            Test.stopTest();

            System.assertEquals(OrderFormController.DEFAULT_CONTACT, contact.Name);
        }
    }

    @IsTest static void testGetStdPriceBook() {
        Pricebook2 standardPricebook = new Pricebook2(
                Id = Test.getStandardPricebookId(),
                IsActive = true
        );
        update standardPricebook;

        Account account = new Account(Name = OrderFormController.DEFAULT_ACCOUNT);
        insert account;
        Account accountDefault = [SELECT Id FROM Account LIMIT 1];
        insert new Contact(FirstName = 'Test', LastName = 'Contact', AccountId = accountDefault.Id);
        Contact contactTestCustomer = [SELECT Id, Name FROM Contact WHERE Name = 'Test Contact'];


        Profile customerProfile = [SELECT Id FROM Profile WHERE Name = 'Community Self-Reg User'];

        User customerUser = new User(Alias = 'standt', Email = 'standarduser@testorg.com',
                EmailEncodingKey = 'UTF-8', LastName = 'Customer', LanguageLocaleKey = 'en_US',
                LocaleSidKey = 'en_US', ProfileId = customerProfile.Id,ContactId = contactTestCustomer.Id,
                TimeZoneSidKey = 'America/Los_Angeles', Username = 'standarduser@testorg.com');

        System.runAs(customerUser) {

            Test.startTest();
            Id pricebookId = OrderFormController.getStdPriceBook();
            Test.stopTest();

            System.assertEquals(Test.getStandardPricebookId(), pricebookId);
        }
    }


    private static void createOrdersWithUsersWaiterCustomer() {

        Profile waiterProfile = [SELECT Id FROM Profile WHERE Name = 'Waiter Profile'];
        Profile customerProfile = [SELECT Id FROM Profile WHERE Name = 'Community Self-Reg User'];


        Account account = new Account(Name = OrderFormController.DEFAULT_ACCOUNT);
        insert account;
        Account accountDefault = [SELECT Id FROM Account LIMIT 1];

        List<Contact> contacts = new List<Contact>();
        contacts.add(new Contact(FirstName = 'Default', LastName = 'Contact', AccountId = accountDefault.Id));
        contacts.add(new Contact(FirstName = 'Test', LastName = 'Contact', AccountId = accountDefault.Id));

        insert contacts;

        Contact contactTestCustomer = [SELECT Id, Name FROM Contact WHERE Name = 'Test Contact'];

        User testUser = new User(Alias = 'standt', Email = 'standarduser@testorg.com',
                EmailEncodingKey = 'UTF-8', LastName = 'Customer', LanguageLocaleKey = 'en_US',
                LocaleSidKey = 'en_US', ProfileId = customerProfile.Id, ContactId = contactTestCustomer.Id,
                TimeZoneSidKey = 'America/Los_Angeles', Username = 'standarduser@testorg.com');
        User userWaiter = new User(Alias = 'standt', Email = 'userwaiter@testorg.com',
                EmailEncodingKey = 'UTF-8', LastName = 'Waiter', LanguageLocaleKey = 'en_US',
                LocaleSidKey = 'en_US', ProfileId = waiterProfile.Id,
                TimeZoneSidKey = 'America/Los_Angeles', Username = 'userwaiter@testorg.com');

        insert new List<User>{
                testUser, userWaiter
        };

        List<Order> orders = new List<Order>();
        for (Integer i = 0; i < 20; i++) {
            if (Math.mod(i, 2) == 0) {
                orders.add(new Order(
                        Status = i < 10 ? 'Pending Activated' : 'Draft',
                        AccountId = accountDefault.Id,
                        EffectiveDate = Date.today(),
                        Pricebook2Id = Test.getStandardPricebookId(),
                        OwnerId = userWaiter.Id
                ));
            } else {
                orders.add(new Order(
                        Status = i < 10 ? 'Pending Activated' : 'Draft',
                        Contact__c = contactTestCustomer.Id,
                        AccountId = accountDefault.Id,
                        EffectiveDate = Date.today(),
                        Pricebook2Id = Test.getStandardPricebookId(),
                        OwnerId = testUser.Id
                ));
            }
        }
        insert orders;
    }
}