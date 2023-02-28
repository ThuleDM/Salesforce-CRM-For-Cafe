import {LightningElement, api, track} from 'lwc';
import getProductsByGroups from '@salesforce/apex/OrderFormController.getProductsByGroups';
import getMapProductsWrappers from '@salesforce/apex/OrderFormController.getMapProductsWrappers';
import getStdPriceBook from '@salesforce/apex/OrderFormController.getStdPriceBook';
import {ShowToastEvent} from "lightning/platformShowToastEvent";


export default class extends LightningElement {

    urlImage = '/sfc/servlet.shepherd/version/renditionDownload?rendition=ORIGINAL_Jpg&operationContext=CHATTER&versionId=';
    foodImg;

    @track mapProductsByGroup = [];
    @api selectedProducts = [];
    @track selectedProductsCopy = [];
    standartPriceBookId;
    @track mapProductsWrappers;
    saveDraftValues;
    @track totalPrice;
    @api orderPrice = 0;
    @track orderPriceCopy;
    @api totalQuantity = 0;
    @track totalQuantityCopy;
    selectedItemValue ;
    selectedItemLabel = 'Sort by'

    
    sortByFlag = "Descending";

    selectedProductsColumns = [
        {label: 'Product', fieldName: 'name'},
        {label: 'Amount', fieldName: 'amount'},
        {label: 'Quantity', fieldName: 'quantity', type: 'number', editable: true},
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

    async connectedCallback() {
        this.standartPriceBookId = await getStdPriceBook();
        this.mapProductsWrappers = await getMapProductsWrappers({stdPriceBookId: this.standartPriceBookId});
        let dataResult = await getProductsByGroups();
        if (dataResult) {
            for (let key in dataResult) {
                this.mapProductsByGroup.push({products: [...dataResult[key]], key: key});
            }
        }
        console.log('sadsadsad' + this.mapProductsWrappers);
    }

    toggleCardFlip(event) {
        if (event.currentTarget.dataset.descr) {
            event.currentTarget.classList.toggle('is-flipped');
        }
    }
    sortListItems = [
        {value:"ascendingSort", label:"Ascending price"},
        {value:"descendingSort", label:"Descending price"},
        {value:"alphabeticalSort", label:"From A to Z"},
        {value:"notAlphabeticalSort", label:"From Z to A"}
    ];

    handleOnselect(event) {
        console.log(event.target.options);
        this.selectedItemValue = event.detail.value;
        this.selectedItemLabel = this.sortListItems.find(item => item.value == this.selectedItemValue).label;
    }

    handleclick(event) {
        this.selectedProductsCopy = JSON.parse(JSON.stringify(this.selectedProducts));
        this.orderPriceCopy = this.orderPrice;
        this.totalQuantityCopy = this.totalQuantity;
        let productId = event.currentTarget.dataset.item;
        let productWrapper = {...this.mapProductsWrappers[productId]};
        if (this.selectedProductsCopy.length > 0) {
            let selectedProduct = this.selectedProductsCopy.find(x => x?.productId === productId);

            if (!selectedProduct) {
                productWrapper.quantity = 1;
                this.totalQuantityCopy += productWrapper.quantity;
                productWrapper.totalPrice = productWrapper.amount * 1;
                productWrapper.label = productWrapper.name + ' (' + productWrapper.quantity + ')';
                this.orderPriceCopy += productWrapper.totalPrice;
                this.selectedProductsCopy.push(productWrapper);

            } else {
                selectedProduct.quantity += 1;
                this.totalQuantityCopy++;
                selectedProduct.totalPrice = selectedProduct.amount * selectedProduct.quantity;
                selectedProduct.label = selectedProduct.name + ' (' + selectedProduct.quantity + ')';
                this.orderPriceCopy += selectedProduct.amount;
            }

        } else {

            productWrapper.quantity = 1;
            this.totalQuantityCopy += productWrapper.quantity;
            productWrapper.totalPrice = productWrapper.amount * 1;
            productWrapper.label = productWrapper.name + ' (' + productWrapper.quantity + ')';
            this.orderPriceCopy += productWrapper.totalPrice;
            this.selectedProductsCopy.push(productWrapper);
        }

        this.selectedProducts = this.selectedProductsCopy;
        this.orderPrice = this.orderPriceCopy;
        this.totalQuantity = this.totalQuantityCopy;

        this.newCustomEvent();
    }

    // removeFromCart(event) {
    //     const productId = event.detail.row.productId;
    //     const actionName = event.detail.action.name;
    //     if (actionName === 'Remove') {
    //         console.log(event.detail.row.totalPrice);
    //         this.orderPriceCopy = this.orderPrice;
    //         this.orderPriceCopy -= event.detail.row.totalPrice;
    //         this.totalQuantityCopy = this.totalQuantity;
    //         this.totalQuantityCopy -= event.detail.row.quantity;
    //         console.log('Quantity:' + event.detail.row.quantity);
    //         this.selectedProducts = this.selectedProducts.filter(x => x.productId !== productId);
    //     }
    //     this.orderPrice = this.orderPriceCopy;
    //     this.totalQuantity = this.totalQuantityCopy;
    //     this.newCustomEvent();
    // }

    // handleSave(event) {
    //     this.selectedProductsCopy = JSON.parse(JSON.stringify(this.selectedProducts));
    //     this.orderPriceCopy = this.orderPrice;
    //     this.totalQuantityCopy = this.totalQuantity;
    //     this.saveDraftValues = event.detail.draftValues;
    //     const recordInputs = this.saveDraftValues.slice().map(draft => {
    //         const fields = Object.assign({}, draft);
    //         if (Number(fields.quantity) > 0) {
    //             this.selectedProductsCopy.forEach(elem => {
    //                 if (elem.productId === fields.productId) {
    //                     elem.quantity = Number(fields.quantity);
    //                     elem.totalPrice = elem.amount * Number(fields.quantity);
    //                 }
    //             })
    //         } else {
    //             const evt = new ShowToastEvent({
    //                 title: 'ERROR',
    //                 message: 'Quantity must be a positive number.',
    //                 variant: 'error',
    //             });
    //             this.dispatchEvent(evt);
    //         }

    //     });
    //     this.orderPriceCopy = 0;
    //     this.totalQuantityCopy = 0;
    //     this.selectedProductsCopy.forEach(elem => {
    //         this.orderPriceCopy += elem.totalPrice;
    //         this.totalQuantityCopy += elem.quantity;
    //     })

    //     this.selectedProductsCopy = [...this.selectedProductsCopy];
    //     this.selectedProducts = this.selectedProductsCopy;
    //     this.orderPrice = this.orderPriceCopy;
    //     this.totalQuantity = this.totalQuantityCopy;
    //     this.saveDraftValues = [];

    //     this.newCustomEvent();

    // }

    // sortByAsc() {
    //     this.sortByAscFlag = true;
    //
    //     for (let productsByGroup of this.mapProductsByGroup) {
    //         productsByGroup.products.sort((product1, product2)=> {
    //                 return product1.name > product2.name ? 1 : -1;
    //             }
    //         );
    //     }
    // }

    sortByName() {
        console.log('Sort by desc');
        // this.mapProductsWrappers.sort((p1,p2) => p2.amount - p1.amount);
        this.sortByFlag = this.sortByFlag === "Ascending" ? "Descending": "Ascending"
        try {
            // for (let productsByGroup of this.mapProductsByGroup) {
            //     productsByGroup.products = productsByGroup.products.sort((product1, product2) => {
            //             return product1.name > product2.name ? 1 : -1;
            //         }
            //     ).reverse();
            // }
            for (let productsByGroup of this.mapProductsByGroup) {
                productsByGroup.products = productsByGroup.products.reverse();
            }
        }catch (e){
            console.error(e)
        }
    }

    sortButton(){
        console.log('sort');
        if(this.selectedItemValue.includes('ascending')){
            console.log('sort by asc');
            for (let productsByGroup of this.mapProductsByGroup) {
                productsByGroup.products.sort((product1, product2) => {
                        return product1.amount - product2.amount; 
                    }
                )
            }
        }
        if (this.selectedItemValue.includes('descending')) {
            console.log('Sort by desc');
            for (let productsByGroup of this.mapProductsByGroup) {
                productsByGroup.products.sort((product1, product2) => {
                        return product2.amount - product1.amount ; 
                    }
                )
            }
        }

        if(this.selectedItemValue.includes('alphabetical')){
            for (let productsByGroup of this.mapProductsByGroup) {
                productsByGroup.products.sort((product1, product2) => {
                    if(product1.name < product2.name){ return -1; }
                    if(product1.name > product2.name){ return 1; }
                    return 0;
                })
            }
        }

        if(this.selectedItemValue.includes('notAlphabetical')){
            for (let productsByGroup of this.mapProductsByGroup) {
                productsByGroup.products.sort((product1, product2) => {
                    if(product1.name > product2.name){ return -1; }
                    if(product1.name < product2.name){ return 1; }
                    return 0;
                })
            }
        }
    }

    newCustomEvent() {
        const selectedEvent = new CustomEvent("selectedproductschange", {
            detail: {
                selectedProducts: this.selectedProducts,
                orderPrice: this.orderPrice,
                totalQuantity: this.totalQuantity
            }
        });
        this.dispatchEvent(selectedEvent);
    }

}