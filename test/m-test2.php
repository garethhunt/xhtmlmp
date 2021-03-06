<?php
header("Content-Type: multipart/mixed; boundary=part2x");
?>


--part2x
Content-Type: text/html
Content-Location: m-test2.php
Content-Transfer-Encoding: binary

<html>
  <head>
    <title>Multipart Test 2</title>
  </head>
  <body>
    <!-- The content should be output without barfing on this comment -->
    <p>This content is encoded using <em>multipart/mixed</em></p>
    <p>The Firefox image below is part of this Multipart package.</p>
    <div>
      <img src="product-firefox.gif" alt="Mozilla Firefox" />
    </div>
    <p>This test has additional newlines before the part delimiter.</p>
  </body>
</html>


--part2x
Content-Type: image/gif
Content-Location: product-firefox.gif
Content-Transfer-Encoding: binary

<?php include "product-firefox.gif" ?>


--part2x--
