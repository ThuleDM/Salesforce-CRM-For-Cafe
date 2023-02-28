import {LightningElement, track, wire, api} from 'lwc';
import {createRecord} from 'lightning/uiRecordApi';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import createOrderItems from '@salesforce/apex/OrderFormController.createOrderItems';
import getStdPriceBook from '@salesforce/apex/OrderFormController.getStdPriceBook';
import gerCurrentUserInfo from '@salesforce/apex/OrderFormController.gerCurrentUserInfo';
import getProductsWrapperFromExistOrder from '@salesforce/apex/OrderFormController.getProductsWrapperFromExistOrder';
import EMAIL_ERROR from '@salesforce/label/c.IncorrectEmailError';
import ORDERD_CREATED_SUCCESS from '@salesforce/label/c.orderCreatedSuccess';
import ERROR_CREARING_RECORD from '@salesforce/label/c.errorCreatingRecord';
import ERROR_GET_PRICEBOOKENTRY from '@salesforce/label/c.errorGetPriceBookEntry';
import ERROR_DIDNOT_CHOOSE_PRODUCT from '@salesforce/label/c.errorDidNotChooseProduct';

export default class OrderForm extends LightningElement {
    contactInfo;
    @api formForWaiter = false;
    @track orderComment;
    @track readyTime = new Date(new Date().getTime() + (30 * 60 * 1000)).toISOString();
    standartPriceBookId;
    @track isModalOpen = false;
    @track isCartOpen = false;
    @track currentDate = new Date(new Date().getTime() + (30 * 60 * 1000)).toISOString();
    @track showEmail = true;
    @track selectedProducts = [];
    @track enteredEmail;
    @track orderWasCreated = false;
    @track orderPrice = 0;
    @track totalQuantity = 0;
    createdOrder;
    homeUrl = location.href.substring( 0, location.href.indexOf( "/s/" ) );

    async connectedCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('repeatOrderId')){
            let existSelectedProducts = await getProductsWrapperFromExistOrder({orderId : urlParams.get('repeatOrderId')});
            if (existSelectedProducts.length > 0){
                this.selectedProducts = [...existSelectedProducts];
                this.selectedProducts.forEach(elem => {
                    this.orderPrice += elem.totalPrice;
                    this.totalQuantity += elem.quantity;
                    this.isCartOpen = true;
                })
            }
        }
        this.contactInfo = await gerCurrentUserInfo();
        this.standartPriceBookId = await getStdPriceBook();
        this.enteredEmail = this.contactInfo.Email;
    }

    openCart() {
        this.isCartOpen = true;
    }
    closeCart() {
        this.isCartOpen = false;
    }

    handleSelectedProductsChangeFromMenuItem(event) {
        this.selectedProducts = event.detail.selectedProducts;
        this.orderPrice = event.detail.orderPrice;
        this.totalQuantity = event.detail.totalQuantity;
    }

    handleSelectedProductsChangeFromDataTable(event) {
        this.selectedProducts = event.detail.selectedProducts;
        this.orderPrice = event.detail.orderPrice;
        this.totalQuantity = event.detail.totalQuantity;
    }
    
    orderCommentChangedHandler(event) {
        this.orderComment = event.target.value;
    }

    readyTimeChangedHandler(event) {
        this.readyTime = event.target.value;
    }

    toggleChangedHandler(event) {
        console.log(this.showEmail)
        this.showEmail = !this.showEmail;
        console.log(this.showEmail)
    }

    enteredEmailChangedHandler(event) {
        this.enteredEmail = event.target.value;
    }

    handleEmailValidation() {
        let flag = true;
        const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        let email = this.template.querySelector('[data-id="txtEmailAddress"]');
        let emailVal = email.value;
        if (!emailVal.match(emailRegex)) {
            flag = false;
        }
        return flag;
    }

    createOrder() {
        let emailValid = this.showEmail ? this.handleEmailValidation() : true;
        if (!emailValid && this.showEmail) {
            const evt = new ShowToastEvent({
                title: 'ERROR',
                message: EMAIL_ERROR,
                variant: 'error',
            });
            this.dispatchEvent(evt);
            return;
        }

        const isInputsCorrect = [...this.template.querySelectorAll('lightning-input')]
                .reduce((validSoFar, inputField) => {
                    inputField.reportValidity();
                    return validSoFar && inputField.checkValidity();
                }, true);
        if (isInputsCorrect && emailValid) {
            let fields = {
                Status: 'Pending Activated',
                AccountId: this.contactInfo.AccountId,
                EffectiveDate: new Date,
                'Pricebook2Id': this.standartPriceBookId,
                'Order_Comment__c': this.orderComment,
                'Ready_Time__c': this.readyTime,
                'Contact__c': this.contactInfo.Id,
                'Notification__c': this.showEmail,
                'Notification_Email__c': this.showEmail === false ? this.contactInfo.Email : this.enteredEmail
            };
            let objRecordInput = {'apiName': 'Order', fields};
            let orderItemsArr = [];
            if (this.selectedProducts.length > 0) {

                createRecord(objRecordInput).then(response => {
                    console.log(response);
                    this.createdOrder = response;
                    for (let product of this.selectedProducts) {
                        let orderItem = {
                            OrderId: response.id,
                            Product2Id: product.productId,
                            Quantity: product.quantity,
                            PricebookEntryId: product.priceBookEntryId,
                            UnitPrice: product.amount
                        }
                        orderItemsArr.push(orderItem);
                    }

                    createOrderItems({orderItems: orderItemsArr})
                        .then(result => {
                            this.orderWasCreated = true;
                            this.message = result;
                            this.error = undefined;
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: 'Toast message',
                                    message: ORDERD_CREATED_SUCCESS,
                                    variant: 'success',
                                    mode: 'dismissable'
                                }),
                            );
                            
                        })  
                        .catch(error => {
                            this.message = undefined;
                            this.error = error;
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: ERROR_CREARING_RECORD,
                                    message: error.body.message,
                                    variant: 'error',
                                }),
                            );
                            console.log("error", JSON.stringify(this.error));
                        });
                    this.message = result;
                    this.error = undefined;
                })
                    .catch(error => {
                        this.message = undefined;
                        this.error = error;
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: ERROR_GET_PRICEBOOKENTRY,
                                message: error.body.message,
                                variant: 'error',
                            }),
                        );
                    });
            } else {
                const evt = new ShowToastEvent({
                    title: 'ERROR',
                    message: ERROR_DIDNOT_CHOOSE_PRODUCT,
                    variant: 'error',
                });
                this.dispatchEvent(evt);
            }
        }
        this.isCartOpen = false;
        this.selectedProducts = [];
        this.totalQuantity = 0;
        this.orderPrice = 0;
    }

    referenceToHome(){
        window.location.replace(this.homeUrl);
    }
}