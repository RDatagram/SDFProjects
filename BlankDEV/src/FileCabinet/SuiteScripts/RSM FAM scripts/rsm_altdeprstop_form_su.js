/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * 
 * This Suitelet script generates a configuration form page
 * 
 */

define(["N/ui/serverWidget", "N/ui/message", "N/http", "N/file", "N/log"], function (serverWidget, message, http, file, log) {

  // Create and add message in the form page
  function showFormMessage(form, type, title, content) {
    var messageTypes = {
      error: message.Type.ERROR,
      warning: message.Type.WARNING,
      information: message.Type.INFORMATION,
      confirmation: message.Type.CONFIRMATION
    };
    form.addPageInitMessage({
      type: messageTypes[type.toLowerCase()],
      title: title,
      message: content
    });
  }

  function onRequest(context) {
    var form = serverWidget.createForm({
      title: "Stopiranje poreske amortizacije"
    });

    if (context.request.method === "GET") {

      showFormMessage(
        form,
        'information',
        'Info',
        "Stopiranje poreske amortizacije nakon sto je racunovodstvena amortizacija prestala " + 
        "je automatizovan proces koji se obavlja jednom dnevno. Ovde mozete rucno pokrenuti isti proces, ukoliko za tim ima potrebe, " +
        "klikom na dugme 'Stopiraj!'."
      )

      var serverMessage = context.request.parameters.message;

      // If there is server message among request parameters, show that message
      if (serverMessage) {
        serverMessage = JSON.parse(serverMessage);
        showFormMessage(
          form,
          serverMessage.type,
          serverMessage.title,
          serverMessage.content
        );
      }

      // Submit button
      form.addSubmitButton({
        label: "Stopiraj!"
      });

      context.response.writePage(form);
    } else {
      // Redirect to the amortization altdeprstop suitelet
      context.response.sendRedirect({
        type: http.RedirectType.SUITELET,
        identifier: 'customscript_altdeprstop_su',
        id: 'customdeploy_altdeprstop_su'
      });

    }
  }

  return {
    onRequest: onRequest
  };
});
