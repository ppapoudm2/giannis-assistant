package com.example.pacmantest;
import android.Manifest;
import android.app.*;
import android.os.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.net.wifi.*;
import android.bluetooth.*;
import android.bluetooth.le.*;
import android.location.LocationManager;
import android.view.*;
import android.widget.*;
import java.util.*;

public class MainActivity extends Activity {
 TextView output, status; Button scan; WifiManager wifi; BluetoothAdapter bluetooth; BluetoothLeScanner ble;
 final Handler handler=new Handler(Looper.getMainLooper());
 final TreeMap<String,String> found=new TreeMap<>(); ScanCallback callback;
 final String[] permissions=Build.VERSION.SDK_INT>=31?
 new String[]{Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.BLUETOOTH_SCAN,Manifest.permission.BLUETOOTH_CONNECT}:
 new String[]{Manifest.permission.ACCESS_FINE_LOCATION};
 int wifiCount=0,bleCount=0;
 public void onCreate(Bundle state){super.onCreate(state);
 LinearLayout root=new LinearLayout(this);root.setOrientation(1);root.setPadding(20,28,20,16);
 TextView heading=new TextView(this);heading.setText("Signal Explorer  •  v1.0");heading.setTextSize(24);root.addView(heading);
 status=new TextView(this);status.setText("Wi-Fi και Bluetooth LE κοντά σου");status.setPadding(0,12,0,12);root.addView(status);
 scan=new Button(this);scan.setText("ΣΑΡΩΣΗ ΣΥΣΚΕΥΩΝ");root.addView(scan);
 ScrollView scroll=new ScrollView(this);output=new TextView(this);output.setTextSize(15);output.setText("Πάτησε ΣΑΡΩΣΗ για να εμφανιστούν δίκτυα και συσκευές με ισχύ σήματος (dBm).");output.setPadding(0,12,0,12);scroll.addView(output);root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
 setContentView(root);wifi=(WifiManager)getApplicationContext().getSystemService(WIFI_SERVICE);
 BluetoothManager bm=(BluetoothManager)getSystemService(BLUETOOTH_SERVICE);bluetooth=bm==null?null:bm.getAdapter();
 scan.setOnClickListener(v->checkAndScan()); }
 void checkAndScan(){ArrayList<String> missing=new ArrayList<>();for(String s:permissions)if(checkSelfPermission(s)!=PackageManager.PERMISSION_GRANTED)missing.add(s);
 if(!missing.isEmpty()){requestPermissions(missing.toArray(new String[0]),7);return;}startScan();}
 @Override public void onRequestPermissionsResult(int request,String[] names,int[] grants){super.onRequestPermissionsResult(request,names,grants);
 if(request==7){for(int x:grants)if(x!=PackageManager.PERMISSION_GRANTED){status.setText("Απαιτούνται άδειες τοποθεσίας και κοντινών συσκευών.");return;}startScan();}}
 void startScan(){found.clear();wifiCount=0;bleCount=0;scan.setEnabled(false);status.setText("Σάρωση σε εξέλιξη (10 δευτερόλεπτα)…");output.setText("");
 LocationManager lm=(LocationManager)getSystemService(LOCATION_SERVICE);
 if(lm!=null&&!lm.isProviderEnabled(LocationManager.GPS_PROVIDER)&&!lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)){status.setText("Ενεργοποίησε την Τοποθεσία του κινητού για αποτελέσματα Wi-Fi.");}
 try { if(wifi!=null){boolean started=wifi.startScan();List<ScanResult> results=wifi.getScanResults();
 for(ScanResult r:results){String name=r.SSID==null||r.SSID.length()==0?"(κρυφό δίκτυο)":r.SSID;found.put("W:"+r.BSSID,"Wi-Fi  "+name+"\n"+r.BSSID+"   "+r.level+" dBm\n");wifiCount++;}
 if(!started)status.setText("Το Android περιορίζει τις σαρώσεις Wi-Fi· εμφανίζονται πρόσφατα αποτελέσματα.");}}catch(Exception e){found.put("W:error","Wi-Fi: "+e.getClass().getSimpleName()+"\n");}
 try {if(bluetooth!=null&&bluetooth.isEnabled()){ble=bluetooth.getBluetoothLeScanner();
 if(ble!=null){callback=new ScanCallback(){@Override public void onScanResult(int type,android.bluetooth.le.ScanResult r){BluetoothDevice d=r.getDevice();String name="(άγνωστη συσκευή)";
 try{if(d.getName()!=null)name=d.getName();}catch(SecurityException ignored){}
 String key="B:"+d.getAddress();if(!found.containsKey(key))bleCount++;found.put(key,"Bluetooth LE  "+name+"\n"+d.getAddress()+"   "+r.getRssi()+" dBm\n");render();}};
 ble.startScan(callback);}}else found.put("B:off","Bluetooth: ενεργοποίησέ το για σάρωση.\n");}catch(Exception e){found.put("B:error","Bluetooth: "+e.getClass().getSimpleName()+"\n");}
 render();handler.postDelayed(()->{try{if(ble!=null&&callback!=null)ble.stopScan(callback);}catch(Exception ignored){}callback=null;scan.setEnabled(true);
 status.setText("Ολοκληρώθηκε • Wi-Fi: "+wifiCount+" • Bluetooth LE: "+bleCount);render();},10000);}
 void render(){StringBuilder sb=new StringBuilder();for(String s:found.values())sb.append(s).append("\n");
 if(sb.length()==0)sb.append("Δεν βρέθηκαν συσκευές. Έλεγξε Wi-Fi, Bluetooth και Τοποθεσία.");
 output.setText(sb.toString());}
}
