<form class="form">
  <div class="row">
    <div class="col-sm-6 col-xs-12">
      <div class="form-group">
        <label>accessKey</label>
        <input id="accessKey" type="text" class="form-control" placeholder="Enter Accesskey" value="{settings.accessKey}">
      </div>
      <div class="form-group">
        <label>secretKey</label>
        <input id="secretKey" type="text" class="form-control" placeholder="Enter SecretKey" value="{settings.secretKey}">
      </div>
      <div class="form-group">
        <label>bucket</label>
        <input id="bucket" type="text" class="form-control" placeholder="Enter Bucket" value="{settings.bucket}">
      </div>
      <div class="form-group">
        <label>host</label>
        <input id="host" type="text" class="form-control" placeholder="Enter Host" value="{settings.host}">
      </div>
    </div>
  </div>
</form>


<button class="btn btn-primary" id="save">Save</button>

<input id="csrf_token" type="hidden" value="{csrf}" />

<script type="text/javascript">

  $('#save').on('click', function() {
    var data = {
      _csrf: $('#csrf_token').val(),
      accessKey: $.trim($('#accessKey').val()),
      secretKey: $.trim($('#secretKey').val()),
      bucket: $.trim($('#bucket').val()),
      host: $.trim($('#host').val())
    };

    if (!data.accessKey) {
      return app.alertError('need accessKey');
    }
    if (!data.secretKey) {
      return app.alertError('need secretKey');
    }
    if (!data.bucket) {
      return app.alertError('need bucket');
    }
    if (!data.host) {
      return app.alertError('need host');
    }

    $.post(config.relative_path + '/api/admin/plugins/qiniu/save', data, function(data) {
      app.alertSuccess(data.message);
    });

    return false;
  });
</script>

