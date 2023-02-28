import {LightningElement, track} from 'lwc';
import getOrdersList from '@salesforce/apex/OrderFormController.getOrdersList';
import getProductsWrapperFromExistOrder from '@salesforce/apex/OrderFormController.getProductsWrapperFromExistOrder';

export default class OrdersDatatable extends LightningElement {
    @track orders;
    @track clickedOrder;
    @track productsFromExistedOrder;
    @track error;
    homeUrl = location.href.substring( 0, location.href.indexOf( "/s/" ) + 3);
    products = ['prod1', 'prod2', 'prod3'];
    @track isModalOpen = false;
    openModal() {
        this.isModalOpen = true;
    }
    closeModal() {
        this.isModalOpen = false;
    }

    ordersColumns = [
        {label: 'OrderNumber', fieldName: 'OrderNumber'},
        {label: 'Total Amount', fieldName: 'TotalAmount'},
        {label: 'Notification?', fieldName: 'Notification__c'},
        {label: 'Notification Email', fieldName: 'Notification_Email__c'},
        {label: 'Status', fieldName: 'Status'},
        {label: 'Ready Time', fieldName: 'Ready_Time__c', type: "date",
            typeAttributes:{
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "2-digit",
                year: "numeric"}
        },
        {
            type: "button", label: 'Repeat Order', typeAttributes: {
                label: 'Repeat Order',
                name: 'RepeatOrder',
                title: 'Repeat Order',
                disabled: false,
                value: 'repeatOrder',
                iconPosition: 'left'
            }
        },
        {
            type: "button", label: 'Products', typeAttributes: {
                label: 'Products',
                name: 'Products',
                title: 'Productsr',
                disabled: false,
                value: 'Products',
                iconPosition: 'left'
            }
        }
    ];

    productsColumns = [
        {label: 'Quantity', fieldName: 'quantity'},
        {label: 'Product', fieldName: 'name'},
    ]

    async connectedCallback() {
        this.orders = await getOrdersList();
    }

    onRowAction(event) {
        const orderId = event.detail.row.Id;
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        if (actionName === 'RepeatOrder') {
            window.location.replace(this.homeUrl + 'create-order/?repeatOrderId=' + orderId);
        }
        if(actionName === 'Products'){
            this.openModal();
            getProductsWrapperFromExistOrder({orderId : orderId})
                .then(result => {
                    this.productsFromExistedOrder = result;
                }).catch(error => {
                    this.error = error;
                })
        }
    }
}