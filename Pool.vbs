Set WshShell = CreateObject("WScript.Shell")
currentPath = CreateObject("Scripting.FileSystemObject").GetAbsolutePathName(".")

' تلاش برای باز کردن با اج یا کروم در حالت اپلیکیشن مستقل
cmdEdge = "msedge.exe --app=""file:///" & Replace(currentPath, "\", "/") & "/index.html"""
cmdChrome = "chrome.exe --app=""file:///" & Replace(currentPath, "\", "/") & "/index.html"""

On Error Resume Next
WshShell.Run cmdEdge, 1, False
If Err.Number <> 0 Then
    WshShell.Run cmdChrome, 1, False
End If