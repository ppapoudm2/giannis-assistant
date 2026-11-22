package com.example.pacmantest;
import android.app.Activity;
import android.os.Bundle;
import android.content.Context;
import android.graphics.*;
import android.hardware.*;
import android.speech.tts.TextToSpeech;
import android.view.*;
import java.util.*;

public class MainActivity extends Activity implements SensorEventListener {
 SensorManager sensors; Sensor accel; Game game; TextToSpeech speech;
 float tiltX=0,tiltY=0,zeroX=0,zeroY=0; boolean calibrated=false; boolean sensorAvailable=false;
 @Override public void onCreate(Bundle b){super.onCreate(b); sensors=(SensorManager)getSystemService(SENSOR_SERVICE);accel=sensors.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);sensorAvailable=accel!=null;game=new Game(this);setContentView(game);speech=new TextToSpeech(this,status->{if(status==TextToSpeech.SUCCESS&&speech!=null){int lang=speech.setLanguage(new Locale("el","GR"));game.ttsReady=lang!=TextToSpeech.LANG_MISSING_DATA&&lang!=TextToSpeech.LANG_NOT_SUPPORTED;}});}
 @Override protected void onResume(){super.onResume();if(accel!=null)sensors.registerListener(this,accel,SensorManager.SENSOR_DELAY_GAME);}
 @Override protected void onPause(){sensors.unregisterListener(this);super.onPause();}
 @Override protected void onDestroy(){if(speech!=null){speech.stop();speech.shutdown();}super.onDestroy();}
 @Override public void onAccuracyChanged(Sensor s,int a){}
 @Override public void onSensorChanged(SensorEvent e){if(e.sensor.getType()!=Sensor.TYPE_ACCELEROMETER)return;tiltX=.8f*tiltX+.2f*e.values[0];tiltY=.8f*tiltY+.2f*e.values[1];if(!calibrated){zeroX=tiltX;zeroY=tiltY;calibrated=true;}}
 class Game extends View {
  final int W=15,H=19; final int[][] map=new int[H][W]; final boolean[][] pellets=new boolean[H][W]; final Paint p=new Paint(3); final Random rng=new Random(7); Bitmap face=null;
  float px=7,py=15; float heading=0; long[] ghostProtectedUntil={0,0,0}; int pelletsLeft=0; boolean ttsReady=false; float[] gx={2,12,7},gy={2,2,9}; int score=0,level=1; long levelStarted=System.currentTimeMillis(); long last=0,lastVoice=0; float phase=0; boolean paused=false;
  Game(Context c){super(c);setLayerType(View.LAYER_TYPE_SOFTWARE,null);int faceId=getResources().getIdentifier("mitsos_face","drawable",getPackageName());if(faceId!=0){try{face=BitmapFactory.decodeResource(getResources(),faceId);}catch(Exception ignored){face=null;}}if(face==null){try(java.io.InputStream in=getAssets().open("mitsos_face.b64");java.io.ByteArrayOutputStream out=new java.io.ByteArrayOutputStream()){byte[] buf=new byte[1024];int n;while((n=in.read(buf))!=-1)out.write(buf,0,n);byte[] bytes=android.util.Base64.decode(out.toByteArray(),android.util.Base64.DEFAULT);face=BitmapFactory.decodeByteArray(bytes,0,bytes.length);}catch(Exception ignored){face=null;}}reset();}
  void reset(){levelStarted=System.currentTimeMillis();pelletsLeft=0;for(int y=0;y<H;y++)for(int x=0;x<W;x++){boolean wall=x==0||y==0||x==W-1||y==H-1||(x%4==0&&y%5!=2&&y%5!=3&&y>2&&y<H-3)||(y%6==0&&x%5!=2&&x%5!=3&&x>2&&x<W-3);map[y][x]=wall?1:0;pellets[y][x]=!wall;}map[15][7]=0;map[9][7]=0;map[2][2]=0;map[2][12]=0;pellets[15][7]=false;pellets[9][7]=false;pellets[2][2]=false;pellets[2][12]=false;px=7;py=15;heading=0;gx=new float[]{2,12,7};gy=new float[]{2,2,9};Arrays.fill(ghostProtectedUntil,0);boolean[][] seen=new boolean[H][W];ArrayDeque<int[]> q=new ArrayDeque<>();q.add(new int[]{7,15});seen[15][7]=true;while(!q.isEmpty()){int[] t=q.removeFirst();for(int[] d:new int[][]{{1,0},{-1,0},{0,1},{0,-1}}){int nx=t[0]+d[0],ny=t[1]+d[1];if(free(nx,ny)&&!seen[ny][nx]){seen[ny][nx]=true;q.addLast(new int[]{nx,ny});}}}for(int y=0;y<H;y++)for(int x=0;x<W;x++)if(!seen[y][x])pellets[y][x]=false;else if(pellets[y][x])pelletsLeft++;}
  boolean free(int x,int y){return x>=0&&x<W&&y>=0&&y<H&&map[y][x]==0;}
  void move(float dx,float dy){float nx=px+dx,ny=py+dy;int tileX=Math.round(px),tileY=Math.round(py);if(free(Math.round(nx),tileY))px=nx;if(free(Math.round(px),Math.round(ny)))py=ny;px=Math.max(.5f,Math.min(W-1.5f,px));py=Math.max(.5f,Math.min(H-1.5f,py));}
  void step(float dt){if(paused)return;phase+=dt*9;float dx=-(tiltX-zeroX),dy=-(tiltY-zeroY);float dead=.65f;if(Math.abs(dx)<dead)dx=0;if(Math.abs(dy)<dead)dy=0;float mx=Math.max(-1,Math.min(1,dx/4)),my=Math.max(-1,Math.min(1,dy/4));if(Math.abs(mx)>Math.abs(my)&&Math.abs(mx)>.05f)heading=mx>0?0:180;else if(Math.abs(my)>.05f)heading=my>0?90:270;move(mx*dt*3,my*dt*3);
   int ix=Math.round(px),iy=Math.round(py);if(free(ix,iy)&&pellets[iy][ix]){pellets[iy][ix]=false;pelletsLeft--;score+=10;}
   for(int i=0;i<gx.length;i++){float dist=(float)Math.hypot(px-gx[i],py-gy[i]);if(dist<.7f&&System.currentTimeMillis()>ghostProtectedUntil[i]){score+=100;ghostProtectedUntil[i]=System.currentTimeMillis()+2500;gx[i]=i==0?2:(i==1?12:7);gy[i]=i==2?9:2;if(ttsReady&&speech!=null)speech.speak("Ααα! Με έφαγε ο Μήτσος!",TextToSpeech.QUEUE_ADD,null,"eaten"+i);continue;}float best=-999;int bx=0,by=0;for(int[] d:new int[][]{{1,0},{-1,0},{0,1},{0,-1}}){int nx=Math.round(gx[i])+d[0],ny=Math.round(gy[i])+d[1];if(!free(nx,ny))continue;float v=(float)Math.hypot(nx-px,ny-py)+rng.nextFloat()*.8f;if(v>best){best=v;bx=d[0];by=d[1];}}float speed=dt*(.7f+level*.08f);float nextX=gx[i]+bx*speed,nextY=gy[i]+by*speed;if(free(Math.round(nextX),Math.round(nextY))){gx[i]=nextX;gy[i]=nextY;}
    if(dist<4&&System.currentTimeMillis()-lastVoice>9000&&ttsReady&&speech!=null){lastVoice=System.currentTimeMillis();speech.speak("Βοήθεια! Έρχεται ο Μήτσος!",TextToSpeech.QUEUE_FLUSH,null,"ghost");}
   }
   if(pelletsLeft==0){level++;reset();}
  }
  @Override protected void onDraw(Canvas c){long now=System.currentTimeMillis();float dt=last==0?0:Math.min(.045f,(now-last)/1000f);last=now;step(dt);super.onDraw(c);c.drawColor(Color.rgb(7,7,19));float cell=Math.max(1f,Math.min(getWidth()/(float)W,(getHeight()-110f)/H));float ox=(getWidth()-W*cell)/2,oy=90;
   p.setTextSize(Math.min(32f,Math.max(16f,getWidth()/13f)));p.setColor(Color.WHITE);c.drawText("ΜΗΤΣΟΣ  "+score+"   LEVEL "+level,16,46,p);p.setTextSize(Math.min(17f,Math.max(11f,getWidth()/25f)));c.drawText(sensorAvailable?"Πάνω: παύση | Πίστα: βαθμονόμηση":"Δεν βρέθηκε αισθητήρας κλίσης",16,72,p);p.setTextSize(15);c.drawText("Τελείες: "+pelletsLeft,Math.max(12,getWidth()-140),72,p);if(paused){p.setColor(Color.YELLOW);p.setTextSize(24);c.drawText("ΠΑΥΣΗ",Math.max(12,getWidth()/2-45),Math.max(120,getHeight()-15),p);}
   for(int y=0;y<H;y++)for(int x=0;x<W;x++){float cx=ox+(x+.5f)*cell,cy=oy+(y+.5f)*cell;if(map[y][x]==1){p.setColor(Color.rgb(25,75,210));c.drawRoundRect(ox+x*cell+1,oy+y*cell+1,ox+(x+1)*cell-1,oy+(y+1)*cell-1,5,5,p);}else if(pellets[y][x]){p.setColor(Color.rgb(255,218,160));c.drawCircle(cx,cy,cell*.075f,p);}}
   for(int i=0;i<gx.length;i++){float x=ox+(gx[i]+.5f)*cell,y=oy+(gy[i]+.5f)*cell;p.setColor(new int[]{Color.RED,Color.CYAN,Color.MAGENTA}[i]);c.drawCircle(x,y,cell*.37f,p);c.drawRect(x-cell*.37f,y,x+cell*.37f,y+cell*.32f,p);p.setColor(Color.WHITE);c.drawCircle(x-cell*.13f,y-cell*.08f,cell*.10f,p);c.drawCircle(x+cell*.13f,y-cell*.08f,cell*.10f,p);}
   float x=ox+(px+.5f)*cell,y=oy+(py+.5f)*cell;float mouth=(float)(15+30*Math.abs(Math.sin(phase)));p.setColor(Color.YELLOW);if(face!=null){c.save();Path circle=new Path();circle.addCircle(x,y,cell*.42f,Path.Direction.CW);c.clipPath(circle);p.setColor(Color.WHITE);c.drawBitmap(face,null,new RectF(x-cell*.42f,y-cell*.42f,x+cell*.42f,y+cell*.42f),p);c.restore();p.setColor(Color.rgb(7,7,19));c.drawArc(x-cell*.44f,y-cell*.44f,x+cell*.44f,y+cell*.44f,heading-mouth,2*mouth,true,p);}else{c.drawArc(x-cell*.42f,y-cell*.42f,x+cell*.42f,y+cell*.42f,heading+mouth,360-2*mouth,true,p);p.setColor(Color.BLACK);c.drawCircle(x+cell*.04f,y-cell*.19f,cell*.055f,p);}
   if(System.currentTimeMillis()-levelStarted<1800){p.setColor(Color.YELLOW);p.setTextSize(Math.min(24f,Math.max(14f,getWidth()/17f)));c.drawText("ΕΠΙΠΕΔΟ "+level,Math.max(12,getWidth()/2-70),Math.max(120,getHeight()-20),p);}postInvalidateDelayed(16);
  }
  @Override public boolean onTouchEvent(android.view.MotionEvent e){if(e.getAction()==MotionEvent.ACTION_UP){if(e.getY()<85){paused=!paused;last=System.currentTimeMillis();invalidate();}else if(sensorAvailable){zeroX=tiltX;zeroY=tiltY;calibrated=true;}return true;}return true;}
 }
}