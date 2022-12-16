<template>
  <div>
    <oc-button id="oc-topbar-account-links" appearance="raw" variation="inverse">
      <oc-icon name="questionnaire" />
    </oc-button>
    <oc-drop
      id="links"
      drop-id="links"
      toggle="#oc-topbar-account-links"
      mode="hover"
      close-on-click
      padding-size="small"
      class="oc-width-auto"
    >
      <oc-list
        ><li class="oc-menu-item-hover">
          <oc-button type="a" appearance="raw" href="https://cernbox.docs.cern.ch/" target="_blanc">
            <oc-icon :name="'book-2'" fill-type="line" class="oc-p-xs" />
            <translate>CERNBox documentation</translate>
          </oc-button>
        </li>
        <li class="oc-menu-item-hover">
          <oc-button
            type="a"
            appearance="raw"
            href="https://cern.service-now.com/service-portal?id=sc_cat_item&name=cernbox-feedback&se=CERNBox-Service&cernbox_service_instance=Production"
            target="_blanc"
          >
            <oc-icon :name="'feedback'" fill-type="line" class="oc-p-xs" />
            <translate>Give us feedback</translate>
          </oc-button>
        </li>
        <li class="oc-menu-item-hover">
          <oc-button
            type="a"
            appearance="raw"
            href="https://cern.service-now.com/service-portal?id=service_element&name=CERNBox-Service"
            target="_blanc"
          >
            <oc-icon :name="'questionnaire'" fill-type="line" class="oc-p-xs" />
            <translate>Open support ticket</translate>
          </oc-button>
        </li>
        <li class="oc-menu-item-hover">
          <oc-button
            type="a"
            appearance="raw"
            href="https://cernbox.web.cern.ch/cernbox/downloads/"
            target="_blanc"
          >
            <oc-icon :name="'computer'" fill-type="line" class="oc-p-xs" />
            <translate>CERNBOX clients</translate>
          </oc-button>
        </li>
      </oc-list>
    </oc-drop>
  </div>
</template>

<style lang="scss">
#links {
  li {
    border: 1px solid transparent;

    a {
      gap: 10px;
      justify-content: left;
      width: 100%;
    }
  }
}
</style>