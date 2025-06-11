// src/frontend/components/PaypalBtn.jsx
import React from "react";
import {
  PayPalScriptProvider,
  PayPalButtons
} from "@paypal/react-paypal-js";

const CLIENT_ID = "ATKtaqm4KTPrpiLo_Jb3e209wvnbu7zK0PC14Uwvw1WSuKMISEuzIDkkMv1dEapOSUZBU_fsgOHxrD1a";

const PaypalBtn = ({ amount, currency = "USD", onSuccess }) => (
  <PayPalScriptProvider options={{
    "client-id": CLIENT_ID,
    currency
  }}>
    <PayPalButtons
      style={{ layout: "vertical" }}
      createOrder={(data, actions) =>
        actions.order.create({
          purchase_units: [{
            amount: {
              value: amount,
              currency_code: currency
            }
          }]
        })
      }
      onApprove={(_, actions) =>
        actions.order
          .capture()
          .then(details => onSuccess(details))
      }
    />
  </PayPalScriptProvider>
);

export default PaypalBtn;
