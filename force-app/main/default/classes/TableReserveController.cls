public with sharing class TableReserveController {

    @AuraEnabled
    public static List<TableWrapper> getTablesInformation() {
        Datetime nowTime = System.now();
        Datetime todayTime = Datetime.newInstanceGmt(Date.today(), Time.newInstance(0,0,0,0));

        List<Table__c> tables = [
                SELECT Id, Name, Maximum_Number_Of_Guests__c, (
                        SELECT Id, Order__c, Number_Of_Guests__c, Name, Start_Time_Of_Table_Reservation__c, Order__r.Status,
                                End_Time_Of_Table_Reservation__c
                        FROM Table_Reserve__r
                        WHERE Start_Time_Of_Table_Reservation__c >: todayTime AND End_Time_Of_Table_Reservation__c = NULL
                        ORDER BY Start_Time_Of_Table_Reservation__c DESC
                )
                FROM Table__c
        ];

        List<TableWrapper> tableWrappers = new List<TableReserveController.TableWrapper>();
        for (Table__c table : tables) {
            String tableColor = 'green';
            Decimal numberOfGuests = 0;
            System.debug(Datetime.now().addHours(2));
            System.debug('**************************');
            for (Table_Reserve__c tableReserve : table.Table_Reserve__r) {
                Datetime startTimeReservation = tableReserve.Start_Time_Of_Table_Reservation__c;

                System.debug(tableReserve.Name);
                System.debug(startTimeReservation);
                if (startTimeReservation <= Datetime.now() && tableReserve.End_Time_Of_Table_Reservation__c == null) {
                    if (tableReserve.Order__c == null) {
                        tableColor = 'red';
                        numberOfGuests = tableReserve.Number_Of_Guests__c;
                        break;
                    } else if (tableReserve.Order__r?.Status != 'Closed'){
                        numberOfGuests = tableReserve.Number_Of_Guests__c;
                        tableColor = 'pink';
                        break;
                    } else {
                        numberOfGuests = tableReserve.Number_Of_Guests__c;
                        tableColor = 'blue';
                        break;
                    }
                } else if (startTimeReservation < Datetime.now().addHours(2)
                        && Datetime.now() < startTimeReservation.addMinutes(-20)) {
                    numberOfGuests = tableReserve.Number_Of_Guests__c;
                    tableColor = 'yellow';
                    break;
                } else {
                    numberOfGuests = tableReserve.Number_Of_Guests__c;
                    tableColor = 'green';
                    break;
                }
            }
            tableWrappers.add(new TableWrapper(table, numberOfGuests, tableColor));

        }

        return tableWrappers;
    }

    public class TableWrapper {
        @AuraEnabled public String tableId;
        @AuraEnabled public Decimal maximumNumberOfGuests;
        @AuraEnabled public Decimal numberOfGuests;
        @AuraEnabled public String label;
        @AuraEnabled public String tableColor;


        public TableWrapper(Table__c table, Decimal numberOfGuests, String tableColor) {
            this.tableId = table.Id;
            this.label = table.Name;
            this.maximumNumberOfGuests = table.Maximum_Number_Of_Guests__c;
            this.numberOfGuests = numberOfGuests;
            this.tableColor = tableColor;
        }
    }
}