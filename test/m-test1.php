<?php
header("Content-Type: multipart/mixed; boundary=part1x");
?>

--part1x
Content-Type: text/html
Content-Location: m-test1.php
Content-Transfer-Encoding: binary

<html>
  <head>
    <title>Multipart test</title>
  </head>
  <body>
    <!-- The content should be output without barfing on this comment -->
    <div>The Firefox image below is part of this Multipart package.</div>
    <div>
      <img src="product-firefox.gif" alt="Mozilla Firefox" />
    </div>
  </body>
</html>

--part1x
Content-Type: image/gif
Content-Location: product-firefox.gif
Content-Transfer-Encoding: binary

<?php include "product-firefox.gif" ?>

--part1x--
