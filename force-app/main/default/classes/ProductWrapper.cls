global class ProductWrapper {
    @AuraEnabled public String productId;
    @AuraEnabled public Decimal amount;
    @AuraEnabled public Decimal totalPrice;
    @AuraEnabled public Decimal quantity;
    @AuraEnabled public String priceBookEntryId;
    @AuraEnabled public String label;
    @AuraEnabled public String name;
    @AuraEnabled public String photoId;
    @AuraEnabled public String description;

    public ProductWrapper(Product2 product, PricebookEntry pricebookEntry, Decimal quantity, String photoId) {
        this.productId = product.Id;
        this.label = product.Name;
        this.name = product.Name;
        this.amount = pricebookEntry.UnitPrice;
        this.totalPrice = pricebookEntry.UnitPrice * quantity;
        this.quantity = quantity;
        this.priceBookEntryId = pricebookEntry.Id;
        this.photoId = photoId;
        this.description = product.Description;
    }
}