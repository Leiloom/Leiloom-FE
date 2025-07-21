import { Html, Head, Main, NextScript } from "next/document";
<script src="https://sdk.mercadopago.com/js/v2"></script>


export default function Document(){
    return(
        <Html>
            <Head>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <body>
                <Main/>
                <NextScript/>
            </body>
        </Html>
    )
}