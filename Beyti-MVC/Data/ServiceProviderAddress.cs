using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Beyti.Data;

[Table("ServiceProviderAddress")]
[Index("AddressId", Name = "IX_ServiceProviderAddress_Address")]
[Index("ServiceProviderId", Name = "IX_ServiceProviderAddress_Provider")]
[Index("ServiceProviderId", "AddressId", Name = "UQ_ServiceProviderAddress", IsUnique = true)]
public partial class ServiceProviderAddress
{
    [Key]
    public int Id { get; set; }

    public int ServiceProviderId { get; set; }

    public int AddressId { get; set; }

    [ForeignKey("AddressId")]
    [InverseProperty("ServiceProviderAddresses")]
    public virtual Address Address { get; set; } = null!;

    [ForeignKey("ServiceProviderId")]
    [InverseProperty("ServiceProviderAddresses")]
    public virtual ServiceProvider ServiceProvider { get; set; } = null!;
}
