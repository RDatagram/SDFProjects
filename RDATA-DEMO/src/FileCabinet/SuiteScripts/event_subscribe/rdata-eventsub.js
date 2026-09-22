/**
 * @NApiVersion 2.1
 * @NScriptType EventSubscriber
 */
define([], () => {
        async function handle(options) {
                const recordType = options.context.recordType;
                const recordId = options.payload.recordId;
                // ...
        }

        return {
                handle: handle
        };
});