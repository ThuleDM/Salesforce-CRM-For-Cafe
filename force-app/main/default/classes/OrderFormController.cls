public class OrderFormController {
    @TestVisible
    private static final String DEFAULT_CONTACT = 'Default Contact';
    @TestVisible
    private static final String DEFAULT_ACCOUNT = 'Default Account';
    @TestVisible
    private static final String DRAFT = 'Draft';
    @TestVisible
    private static final String OTHER = 'Other';
    private static final String COMMUNITY_MENU = 'communityMenu';
    //це все перенести кудись в оргу
    private static final String urlImage = '/sfc/servlet.shepherd/version/renditionDownload?rendition=ORIGINAL_Jpg&operationContext=CHATTER&versionId=';
//    private static final String urlFood = '/SmoothieAndPaddle/resource/1672947835000/food';
    private static final String urlFood = '/EmptyPlate/resource/1673289369000/food';

    @AuraEnabled(Cacheable=true)
    public static Map<String, List<ProductWrapper>> getProductsByGroups() {


        Map<String, List<ProductWrapper>> productsMap = new Map<String, List<ProductWrapper>>();

        List<ContentVersion> contentVersions = [
                SELECT Id, ContentDocumentId, Title
                FROM ContentVersion
                WHERE Title LIKE '%communityMenu%' AND IsLatest = TRUE
        ];

        Map<Id, Id> versionIdToContentDocumentIdMap = new Map<Id, Id>();
        for (ContentVersion contentVersion : contentVersions) {
            versionIdToContentDocumentIdMap.put(contentVersion.ContentDocumentId, contentVersion.Id);
        }

        for (Product2 product : [
                SELECT ProductCode, Name, Category__c, Id, Description,
                (SELECT Id, UnitPrice FROM PricebookEntries WHERE IsActive = TRUE AND Pricebook2.IsStandard = TRUE),
                (SELECT Id, ContentDocumentId
                FROM ContentDocumentLinks
                WHERE ContentDocument.Title LIKE '%communityMenu%')
                FROM Product2
                ORDER BY Name ASC
        ]) {

            String contentVersionId = null;
            if (product.ContentDocumentLinks.size() > 0
                        && versionIdToContentDocumentIdMap.containsKey(product.ContentDocumentLinks[0].ContentDocumentId)) {
                    contentVersionId = versionIdToContentDocumentIdMap.get(product.ContentDocumentLinks[0].ContentDocumentId);
            }

            if (product.PricebookEntries.size() == 1) {
                if (product.Category__c == null) {
                    product.Category__c = OTHER;
                }
                if (!productsMap.containsKey(product.Category__c)) {
                    productsMap.put(product.Category__c, new List<ProductWrapper>());
                }
                productsMap.get(product.Category__c).add(new ProductWrapper(product, product.PricebookEntries.get(0),
                        0, contentVersionId != null ? urlImage + contentVersionId : urlFood));
            }
        }

        return productsMap;
    }

    @AuraEnabled
    public static Contact gerCurrentUserInfo() {
        User currentUser = [SELECT Contact.Email, Contact.Id, Contact.AccountId, ContactId, Name FROM User WHERE Id = :UserInfo.getUserId()];

        if (currentUser.Contact == null) {
            List<Contact> contacts = [SELECT Id FROM Contact WHERE Name = :DEFAULT_CONTACT LIMIT 1];
            if (contacts.size() == 0) {
                Id defaultAccountId;
                List<Account> accounts = [SELECT Id FROM Account WHERE Name = :DEFAULT_ACCOUNT LIMIT 1];
                if (accounts.size() != 1) {
                    insert new Account(Name = DEFAULT_ACCOUNT);
                    defaultAccountId = [SELECT Id FROM Account WHERE Name = :DEFAULT_ACCOUNT LIMIT 1].Id;
                } else {
                    defaultAccountId = accounts.get(0).Id;
                }
                insert new Contact(FirstName = 'Default', LastName = 'Contact', AccountId = defaultAccountId);
            }
            return [SELECT Id, AccountId, Email, Name FROM Contact WHERE Name = :DEFAULT_CONTACT LIMIT 1];
        }

        return currentUser.Contact;
    }

    @AuraEnabled
    public static List<ProductWrapper> getProductsWrapperFromExistOrder(String orderId) {
        List<ProductWrapper> productWrappers = new List<ProductWrapper>();

        List<OrderItem> orderItems = [
                SELECT Id, Product2.Name,Product2.Id, PricebookEntry.Id, PricebookEntry.UnitPrice,
                        Quantity, TotalPrice, Product2.Description
                FROM OrderItem
                WHERE OrderId = :orderId AND Order.OwnerId = :UserInfo.getUserId()
        ];

        if (orderItems.size() > 0) {
            for (OrderItem orderItem : orderItems) {
                productWrappers.add(
                        new ProductWrapper(orderItem.Product2, orderItem.PricebookEntry, orderItem.Quantity, urlFood));
            }
        }

        return productWrappers;
    }

    @AuraEnabled
    public static Map<Id, ProductWrapper> getMapProductsWrappers(String stdPriceBookId) {
        Map<Id, Product2> productsMap = new Map<Id, Product2>([SELECT Id, ProductCode, Name, Description FROM Product2]);

        List<PricebookEntry> entries = [
                SELECT Id, UnitPrice, Product2Id, Product2.Description
                FROM PricebookEntry
                WHERE Pricebook2Id = :stdPriceBookId AND Product2Id IN :productsMap.keySet()
                AND IsActive = TRUE AND Pricebook2.IsStandard = TRUE
        ];

        Map<Id, ProductWrapper> productWrapperMap = new Map<Id, ProductWrapper>();
        for (PricebookEntry pricebookEntry : entries) {
            ProductWrapper productWrapper =
                    new ProductWrapper(productsMap.get(pricebookEntry.Product2Id), pricebookEntry, 0, urlFood);
            productWrapperMap.put(pricebookEntry.Product2Id, productWrapper);
        }

        return productWrapperMap;
    }

    @AuraEnabled
    public static List<OrderItem> createOrderItems(List<OrderItem> orderItems) {
        try {
            insert orderItems;
            return orderItems;

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(Cacheable=true)
    public static Id getStdPriceBook() {
        Pricebook2 stdPriceBook = [SELECT Id, Name FROM Pricebook2 WHERE IsStandard = TRUE LIMIT 1];
        return stdPriceBook.Id;
    }

    @AuraEnabled
    public static List<Order> getOrdersList() {
        String contactId = [SELECT ContactId FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1].ContactId;
        if (contactId == null) {
            return [
                    SELECT Id, OrderNumber, Status, TotalAmount, Notification__c, Notification_Email__c, Ready_Time__c
                    FROM Order
                    WHERE Status != :DRAFT
                    ORDER BY Ready_Time__c DESC
            ];
        } else {
            return [
                    SELECT Id, OrderNumber, Status, TotalAmount, Notification__c, Notification_Email__c, Ready_Time__c
                    FROM Order
                    WHERE Contact__c = :contactId AND Status != :DRAFT
                    ORDER BY Ready_Time__c DESC
            ];
        }
    }
}