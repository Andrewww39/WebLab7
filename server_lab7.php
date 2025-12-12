<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

if ($input) {
    date_default_timezone_set('Europe/Kiev');
    $serverTime = date("Y-m-d H:i:s.u");

    $logEntry = "[$serverTime] Method: {$input['method']} | ID: " . ($input['id'] ?? '?') . "\n";
    file_put_contents('server_log.txt', $logEntry, FILE_APPEND);

    echo json_encode(["status" => "success", "serverTime" => $serverTime]);
} else {
    echo json_encode(["status" => "error"]);
}
?>