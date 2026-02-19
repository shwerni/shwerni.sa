"use server";
// packages
import paypal from "@paypal/checkout-server-sdk";

// config
const config = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_ID as string,
  process.env.PAYPAL_SECRET as string
);

// client
const client = new paypal.core.PayPalHttpClient(config);

let captureOrder = async function (orderId: string) {
  let request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({} as any);
  // Call API with your client and get a response for your call
  let response = await client.execute(request);
  //   console.log(`Response: ${JSON.stringify(response)}`);
  // If call returns body in response, you can get the deserialized version from the result attribute of the response.
  console.log(`Capture:)`);
  console.log(response.result);
};

// create new checkout
export const createPaypalsCheckout = async (oid: string, total: number) => {
  // create checkout
  try {
    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: "100.00",
          },
        },
      ],
    });

    let response = await client.execute(request);

    // capture
    await captureOrder(response.result.id);
    // console.log(`Response: ${JSON.stringify(response)}`);
    // console.log(`Order: ${JSON.stringify(response.result)}`);
    // response log
    console.log(`Order:`);
    console.log(response.result);
    // Your Custom Code for doing something with order
    return { success: true };
  } catch (err) {
    console.log("Err at Create Order: ", err);
    return { success: false, message: "error" };
  }
  //   // update order's pid (payment id)
  //   await updateMoyasarPid(oid, response.data.id);
  //   // redirect to the payment url
  //   redirect(response.data.url);
};
