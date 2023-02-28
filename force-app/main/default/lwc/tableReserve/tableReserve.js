import {LightningElement, track} from 'lwc';
import getTablesInformation from '@salesforce/apex/TableReserveController.getTablesInformation';


export default class TableReserve extends LightningElement {
    @track tablesData = [];

    async connectedCallback() {

        this.tablesData = await getTablesInformation();
        console.log(JSON.stringify(this.tablesData))
    }

    addClass(event){
        let index = event.currentTarget.dataset.rowIndex;
        let flipElement = this.template.querySelector('[data-id="' + index + '"]');
        flipElement.classList.add('class1');
    }

    removeClass(event){
        let index = event.currentTarget.dataset.rowIndex;
        let flipElement = this.template.querySelector('[data-id="' + index + '"]');
        flipElement.classList.remove('class1');
    }
}