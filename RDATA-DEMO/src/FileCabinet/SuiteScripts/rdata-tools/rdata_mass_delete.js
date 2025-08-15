/**
 /**
 * @NApiVersion 2.1
 * @NScriptType MassUpdateScript
 */
define(['N/record'],
    
    (record) => {
        /**
         * Defines the Mass Update trigger point.
         * @param {Object} params
         * @param {string} params.type - Record type of the record being processed
         * @param {number} params.id - ID of the record being processed
         * @since 2016.1
         */
        const each = (params) => {
            try {
                record["delete"]({
                    type: params.type,
                    id: params.id
                })
            } catch (e) {
                log.debug(
                    {
                        title : 'error.mass.delete',
                        details : e.message
                    }
                )
            }
        }

        return {each}

    });
