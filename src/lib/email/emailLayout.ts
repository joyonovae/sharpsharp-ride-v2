export function emailLayout(title: string, content: string) {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>

    <body style="
      margin:0;
      padding:0;
      background:#f5f7fb;
      font-family:Arial,Helvetica,sans-serif;
    ">
      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="padding:40px 20px;"
      >
        <tr>
          <td align="center">

            <table
              width="600"
              cellpadding="0"
              cellspacing="0"
              style="
                background:#ffffff;
                border-radius:20px;
                overflow:hidden;
                border:1px solid #e5e7eb;
              "
            >

              <tr>
                <td
                  style="
                    background:#061116;
                    padding:32px;
                    text-align:center;
                  "
                >
                  <h1
                    style="
                      margin:0;
                      color:#18c37e;
                      font-size:28px;
                      font-weight:800;
                    "
                  >
                    SharpSharp Ride
                  </h1>

                  <p
                    style="
                      margin-top:10px;
                      color:#cbd5e1;
                      font-size:14px;
                    "
                  >
                    Smart Rides • Rentals • Delivery
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:40px;">
                  <h2
                    style="
                      margin-top:0;
                      color:#061116;
                      font-size:32px;
                      font-weight:800;
                    "
                  >
                    ${title}
                  </h2>

                  ${content}
                </td>
              </tr>

              <tr>
                <td
                  style="
                    padding:24px;
                    background:#f8fafc;
                    border-top:1px solid #e5e7eb;
                    text-align:center;
                  "
                >
                  <p
                    style="
                      margin:0;
                      color:#64748b;
                      font-size:13px;
                    "
                  >
                    © ${new Date().getFullYear()} SharpSharp Ride
                  </p>

                  <p
                    style="
                      margin-top:8px;
                      color:#64748b;
                      font-size:13px;
                    "
                  >
                    Need help? Contact support@sharpsharpride.com
                  </p>
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}