<?php

if (isset($_REQUEST['uri'])) {
    readfile($_REQUEST['uri']);
}

