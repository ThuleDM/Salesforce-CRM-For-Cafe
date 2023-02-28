import {api, LightningElement, track} from 'lwc';
import {ShowToastEvent} from "lightning/platformShowToastEvent";

export default class MenuItemsDatatable extends LightningElement {
    @api selectedProducts = [];
    @track selectedProductsCopy = [];
    @api orderPrice;
    @track orderPriceCopy;
    @api totalQuantity = 0;
    @track totalQuantityCopy;
    saveDraftValues;
    

    selectedProductsColumns = [
        {label: 'Product', fieldName: 'name'},
        {label: 'Amount', fieldName: 'amount'},
        {label: 'Quantity', fieldName: 'quantity',type: 'number', editable: true},
        {label: 'Total Price', fieldName: 'totalPrice'},
        {
            type: "button", label: 'Remove', typeAttributes: {
                label: 'Remove',
                name: 'Remove',
                title: 'Remove',
                disabled: false,
                value: 'remove',
                iconPosition: 'left'
            }
        }];

    removeFromCart(event) {
        const productId = event.detail.row.productId;
        const actionName = event.detail.action.name;
        if (actionName === 'Remove') {
            this.orderPriceCopy = this.orderPrice;
            this.orderPriceCopy -= event.detail.row.totalPrice;
            this.totalQuantityCopy = this.totalQuantity;
            this.totalQuantityCopy -= event.detail.row.quantity;
            console.log('Quantity:' + event.detail.row.quantity);
            this.selectedProducts = this.selectedProducts.filter(x => x.productId !== productId);
        }
        this.orderPrice = this.orderPriceCopy;
        this.totalQuantity = this.totalQuantityCopy;

        const selectedEvent = new CustomEvent("removefromcart", {
            detail: {
                selectedProducts: this.selectedProducts,
                orderPrice: this.orderPrice,
                totalQuantity: this.totalQuantity
            }
        });

        this.dispatchEvent(selectedEvent);
    }

    handleSave(event) {
        this.selectedProductsCopy = JSON.parse(JSON.stringify(this.selectedProducts));
        this.orderPriceCopy = this.orderPrice;
        this.totalQuantityCopy = this.totalQuantity;
        this.saveDraftValues = event.detail.draftValues;
        const recordInputs = this.saveDraftValues.slice().map(draft => {
            const fields = Object.assign({}, draft);
            if(Number(fields.quantity) > 0){
                this.selectedProductsCopy.forEach(elem=>{
                    if(elem.productId === fields.productId){
                        elem.quantity = Number(fields.quantity);
                        elem.totalPrice = elem.amount * Number(fields.quantity);
                    }
                })
            }else{
                const evt = new ShowToastEvent({
                    title: 'ERROR',
                    message: 'Quantity must be a positive number.',
                    variant: 'error',
                });
                this.dispatchEvent(evt);
            }

        });
        this.orderPriceCopy = 0;
        this.totalQuantityCopy = 0;
        this.selectedProductsCopy.forEach(elem =>{
            this.orderPriceCopy+= elem.totalPrice;
            this.totalQuantityCopy += elem.quantity;
        })

        this.selectedProductsCopy = [...this.selectedProductsCopy];
        this.selectedProducts = this.selectedProductsCopy;
        this.orderPrice = this.orderPriceCopy;
        this.totalQuantity = this.totalQuantityCopy;
        this.saveDraftValues = [];

        this.customEvent();
    }

    customEvent(){
        const selectedEvent = new CustomEvent("handlesave", {
            detail: {
                selectedProducts: this.selectedProducts,
                orderPrice: this.orderPrice,
                totalQuantity: this.totalQuantity
            }
        });
        this.dispatchEvent(selectedEvent);
    }
}